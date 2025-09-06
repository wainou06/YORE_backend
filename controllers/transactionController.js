const { Transactions, User, UserPlan, Plans } = require('../models')
const ApiError = require('../utils/apiError')
const { Op } = require('sequelize')
const { retryPayment } = require('../utils/payment')
const sequelize = require('../models').sequelize

/**
 * 결제 생성
 */
exports.createTransaction = async (req, res, next) => {
   try {
      const { amount, paymentMethod, userPlanId } = req.body
      const userId = req.user.id

      // 입력값 검증
      if (!amount || !paymentMethod || !userPlanId) {
         throw new ApiError(400, '필수 입력값이 누락되었습니다.')
      }

      // 사용자 플랜 존재 여부 확인
      const userPlan = await UserPlan.findByPk(userPlanId, {
         include: [
            {
               model: Plans,
               as: 'plan',
            },
         ],
      })

      if (!userPlan) {
         throw new ApiError(404, '플랜 정보를 찾을 수 없습니다.')
      }

      // 사용자 권한 확인
      if (userPlan.userId !== userId) {
         throw new ApiError(403, '잘못된 플랜 정보입니다.')
      }

      // 결제 금액 검증
      if (amount !== userPlan.plan.fee) {
         throw new ApiError(400, '결제 금액이 플랜 금액과 일치하지 않습니다.')
      }

      // 트랜잭션 시작
      const t = await sequelize.transaction()

      try {
         // 결제 생성
         const transaction = await Transactions.create(
            {
               amount,
               paymentMethod,
               userPlanId,
               userId,
               status: 'pending',
               date: new Date(),
            },
            { transaction: t }
         )

         // 결제 처리 및 재시도
         const paymentResult = await retryPayment(amount, paymentMethod)

         // 결제 완료 처리
         await transaction.update(
            {
               status: 'success',
               transactionId: paymentResult.transactionId,
            },
            { transaction: t }
         )

         // 플랜 상태 업데이트
         await userPlan.update(
            {
               status: 'active',
               lastPaymentDate: new Date(),
            },
            { transaction: t }
         )

         // 트랜잭션 커밋
         await t.commit()

         const result = await Transactions.findByPk(transaction.id, {
            include: [
               {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email'],
               },
               {
                  model: UserPlan,
                  as: 'userPlan',
                  include: [
                     {
                        model: Plans,
                        as: 'plan',
                     },
                  ],
               },
            ],
         })

         res.status(201).json({
            status: 'success',
            data: result,
         })
      } catch (error) {
         // 트랜잭션 롤백
         await t.rollback()

         // 결제 실패 상태 업데이트
         if (transaction) {
            await transaction.update({
               status: 'failed',
               description: error.message,
            })
         }

         next(error)
      }

      const result = await Transactions.findByPk(transaction.id, {
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: UserPlan,
               as: 'userPlan',
               include: [
                  {
                     model: Plans,
                     as: 'plan',
                  },
               ],
            },
         ],
      })

      res.status(201).json({
         status: 'success',
         data: result,
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 결제 목록 조회
 */
exports.getTransactions = async (req, res, next) => {
   try {
      const { status, startDate, endDate, page = 1, limit = 10 } = req.query
      const where = {}
      const offset = (page - 1) * limit

      // 사용자 권한에 따른 필터
      if (!req.user.isAdmin) {
         where.userId = req.user.id
      }

      // 상태 필터
      if (status) {
         where.status = status
      }

      // 기간 필터
      if (startDate && endDate) {
         where.date = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
         }
      }

      const { count, rows: transactions } = await Transactions.findAndCountAll({
         where,
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: UserPlan,
               as: 'userPlan',
               include: [
                  {
                     model: Plans,
                     as: 'plan',
                  },
               ],
            },
         ],
         order: [['date', 'DESC']],
         offset,
         limit: parseInt(limit),
      })

      res.status(200).json({
         status: 'success',
         data: {
            transactions,
            pagination: {
               total: count,
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               limit: parseInt(limit),
            },
         },
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 결제 상세 조회
 */
exports.getTransaction = async (req, res, next) => {
   try {
      const { id } = req.params

      const transaction = await Transactions.findByPk(id, {
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: UserPlan,
               as: 'userPlan',
               include: [
                  {
                     model: Plans,
                     as: 'plan',
                  },
               ],
            },
         ],
      })

      if (!transaction) {
         throw new ApiError(404, '결제 정보를 찾을 수 없습니다.')
      }

      // 권한 체크
      if (!req.user.isAdmin && transaction.userId !== req.user.id) {
         throw new ApiError(403, '접근 권한이 없습니다.')
      }

      res.status(200).json({
         status: 'success',
         data: transaction,
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 결제 취소/환불
 */
exports.refundTransaction = async (req, res, next) => {
   try {
      const { id } = req.params
      const { reason } = req.body

      const transaction = await Transactions.findByPk(id, {
         include: [
            {
               model: UserPlan,
               as: 'userPlan',
            },
         ],
      })

      if (!transaction) {
         throw new ApiError(404, '결제 정보를 찾을 수 없습니다.')
      }

      // 권한 체크
      if (!req.user.isAdmin && transaction.userId !== req.user.id) {
         throw new ApiError(403, '접근 권한이 없습니다.')
      }

      // 이미 실패 또는 환불된 결제인지 확인
      if (transaction.status !== 'success') {
         throw new ApiError(400, '취소할 수 없는 결제입니다.')
      }

      // 환불 처리 (외부 결제 시스템 연동 필요)
      // ... 환불 처리 로직

      await transaction.update({
         status: 'failed',
         description: reason,
      })

      // 플랜 상태 업데이트
      if (transaction.userPlan) {
         await transaction.userPlan.update({
            status: 'cancelled',
         })
      }

      res.status(200).json({
         status: 'success',
         message: '결제가 취소되었습니다.',
      })
   } catch (error) {
      next(error)
   }
}

// 트랜잭션 ID 생성 함수
const generateTransactionId = () => {
   const prefix = 'TRX'
   const timestamp = Date.now()
   const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
   return `${prefix}${timestamp}${random}`
}

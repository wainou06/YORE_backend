const { UserPlan, User, Plans, Transactions } = require('../models')
const ApiError = require('../utils/apiError')
const { Op } = require('sequelize')

/**
 * 사용자 플랜 생성 (구독 시작)
 */
exports.createUserPlan = async (req, res, next) => {
   try {
      const { planId, startDate = new Date() } = req.body
      const userId = req.user.id

      // 입력값 검증
      if (!planId) {
         throw new ApiError(400, '필수 입력값이 누락되었습니다.')
      }

      // 플랜 정보 확인
      const plan = await Plans.findByPk(planId)
      if (!plan) {
         throw new ApiError(404, '플랜을 찾을 수 없습니다.')
      }

      // 이미 활성화된 플랜이 있는지 확인
      const existingPlan = await UserPlan.findOne({
         where: {
            userId,
            status: 'active',
         },
      })

      if (existingPlan) {
         throw new ApiError(400, '이미 활성화된 플랜이 있습니다.')
      }

      // 플랜 기간 계산
      const endDate = calculateEndDate(startDate, plan.period || 12) // 기본 12개월

      // 요금 계산
      const total_fee = plan.fee
      const monthly_fee = Math.round(total_fee / (plan.period || 12))

      // 사용자 플랜 생성
      const userPlan = await UserPlan.create({
         userId,
         planId,
         total_fee,
         monthly_fee,
         status: 'active',
         startDate,
         endDate,
      })

      const result = await UserPlan.findByPk(userPlan.id, {
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: Plans,
               as: 'plan',
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
 * 사용자 플랜 목록 조회
 */
exports.getUserPlans = async (req, res, next) => {
   try {
      const { status, page = 1, limit = 10 } = req.query
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

      const { count, rows: userPlans } = await UserPlan.findAndCountAll({
         where,
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: Plans,
               as: 'plan',
            },
            {
               model: Transactions,
               as: 'transactions',
               limit: 1,
               order: [['date', 'DESC']],
               where: {
                  status: 'success',
               },
            },
         ],
         order: [['createdAt', 'DESC']],
         offset,
         limit: parseInt(limit),
      })

      res.status(200).json({
         status: 'success',
         data: {
            userPlans,
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
 * 사용자 플랜 상세 조회
 */
exports.getUserPlan = async (req, res, next) => {
   try {
      const { id } = req.params

      const userPlan = await UserPlan.findByPk(id, {
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['id', 'name', 'email'],
            },
            {
               model: Plans,
               as: 'plan',
            },
            {
               model: Transactions,
               as: 'transactions',
               order: [['date', 'DESC']],
               where: {
                  status: 'success',
               },
            },
         ],
      })

      if (!userPlan) {
         throw new ApiError(404, '플랜 정보를 찾을 수 없습니다.')
      }

      // 권한 체크
      if (!req.user.isAdmin && userPlan.userId !== req.user.id) {
         throw new ApiError(403, '접근 권한이 없습니다.')
      }

      res.status(200).json({
         status: 'success',
         data: userPlan,
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 사용자 플랜 취소
 */
exports.cancelUserPlan = async (req, res, next) => {
   try {
      const { id } = req.params
      const { reason } = req.body

      const userPlan = await UserPlan.findByPk(id)
      if (!userPlan) {
         throw new ApiError(404, '플랜 정보를 찾을 수 없습니다.')
      }

      // 권한 체크
      if (!req.user.isAdmin && userPlan.userId !== req.user.id) {
         throw new ApiError(403, '접근 권한이 없습니다.')
      }

      // 이미 취소된 플랜인지 확인
      if (userPlan.status !== 'active') {
         throw new ApiError(400, '이미 취소되었거나 만료된 플랜입니다.')
      }

      await userPlan.update({
         status: 'cancelled',
         endDate: new Date(),
      })

      res.status(200).json({
         status: 'success',
         message: '플랜이 취소되었습니다.',
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 자동 플랜 만료 처리
 * (cron job으로 실행)
 */
exports.checkExpiredPlans = async () => {
   try {
      const expiredPlans = await UserPlan.findAll({
         where: {
            status: 'active',
            endDate: {
               [Op.lt]: new Date(),
            },
         },
      })

      for (const plan of expiredPlans) {
         await plan.update({
            status: 'expired',
         })
      }

      return expiredPlans.length
   } catch (error) {
      console.error('플랜 만료 처리 중 오류 발생:', error)
      throw error
   }
}

// 종료일 계산 함수
const calculateEndDate = (startDate, months) => {
   const date = new Date(startDate)
   date.setMonth(date.getMonth() + months)
   return date
}

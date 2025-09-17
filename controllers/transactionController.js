const { Transactions, Notifications, UserPlan, Plans } = require('../models')
const ApiError = require('../utils/apiError')
const sequelize = require('../models').sequelize

// [POST] /transactions - 결제(Transactions) 생성 및 UserPlan 상태 변경
exports.createTransaction = async (req, res, next) => {
   const t = await sequelize.transaction()
   try {
      const { userId, userPlanId, amount, paymentMethod, isInstallment, installmentMonths, installmentAmount, transactionId, date } = req.body
      if (!userId || !userPlanId || !amount || !paymentMethod || !date) {
         throw new ApiError(400, '필수 결제 정보 누락')
      }
      // UserPlan 존재/상태 확인
      const userPlan = await UserPlan.findByPk(userPlanId, { transaction: t })
      if (!userPlan) throw new ApiError(404, 'UserPlan을 찾을 수 없습니다.')
      if (userPlan.status !== 'pending') throw new ApiError(400, '이미 결제된 요금제입니다.')

      // Transactions 생성 (할부 옵션만 저장, UserPlan은 약정만 반영)
      const transaction = await Transactions.create(
         {
            userId,
            userPlanId,
            amount,
            paymentMethod,
            date: new Date(date),
            status: 'success', // 실제 결제 연동 시 동적으로 처리
            isInstallment: !!isInstallment,
            installmentMonths: isInstallment ? installmentMonths : null,
            installmentAmount: isInstallment ? installmentAmount : null,
            transactionId: transactionId || null,
         },
         { transaction: t }
      )

      // UserPlan 상태 active로 변경
      if (process.env.NODE_ENV === 'development' || req.body.forceActivate) {
         await userPlan.update({ status: 'active' }, { transaction: t })

         // 알림 자동 생성 (가입 승인)
         const planInfo = await Plans.findByPk(userPlan.planId)
         await Notifications.create({
            title: '요금제 가입 승인',
            message: `${planInfo.name} 요금제 가입이 승인되었습니다.`,
            type: 'SERVICE_UPDATE',
            targetUserType: 'USER',
            userId: userPlan.userId,
         })
      }

      await t.commit()
      res.status(201).json({ status: 'success', data: transaction })
   } catch (error) {
      await t.rollback()
      next(error)
   }
}

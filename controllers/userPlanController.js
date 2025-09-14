const { UserPlan, User, Plans, Transactions } = require('../models')
const ApiError = require('../utils/apiError')
const { Op } = require('sequelize')

// [POST] /user-plans - 사용자 요금제 생성 (status: pending, 약정 분할만 적용)
exports.createUserPlan = async (req, res, next) => {
   try {
      const { userId, planId } = req.body
      if (!userId || !planId) {
         throw new ApiError(400, 'userId, planId는 필수입니다.')
      }
      // 중복 가입/대기 방지: 이미 pending 또는 active 상태의 UserPlan이 있으면 에러
      const existing = await UserPlan.findOne({
         where: {
            userId,
            planId,
            status: { [Op.in]: ['pending', 'active'] },
         },
      })
      if (existing) {
         throw new ApiError(400, '이미 가입 대기중이거나 결제된 요금제입니다.')
      }

      // 요금제 정보 조회
      const plan = await Plans.findByPk(planId)
      if (!plan) throw new ApiError(404, '요금제를 찾을 수 없습니다.')

      // 약정기간(dis)이 12 또는 24면 월 분할, 아니면 전체 금액
      let total_fee = plan.finalPrice
      let monthly_fee = plan.finalPrice
      if (plan.dis === '12' || plan.dis === '24') {
         const months = Number(plan.dis)
         monthly_fee = Math.ceil(total_fee / months)
      }

      // UserPlan 생성 (status: pending)
      const userPlan = await UserPlan.create({
         userId,
         planId,
         total_fee,
         monthly_fee,
         status: 'pending',
         startDate: new Date(),
      })
      res.status(201).json({ status: 'success', data: userPlan })
   } catch (error) {
      next(error)
   }
}

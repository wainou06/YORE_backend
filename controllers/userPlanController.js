const { UserPlan, User, Plans, Transactions, Surveys } = require('../models')
const ApiError = require('../utils/apiError')
const { Op } = require('sequelize')

const { yearMonthDay } = require('../utils/dateSet')

exports.createUserPlan = async (req, res, next) => {
   try {
      const { userId, planId } = req.body
      if (!userId || !planId) {
         throw new ApiError(400, 'userId, planId는 필수입니다.')
      }
      // 중복 가입/대기 방지: userId로 pending 또는 active 상태의 UserPlan이 있으면 에러 (planId 무관)
      const existing = await UserPlan.findOne({
         where: {
            userId,
            status: { [Op.in]: ['pending', 'active'] },
         },
      })
      if (existing) {
         throw new ApiError(400, '이미 등록한 요금제가 존재합니다. (진행중/대기중)')
      }

      // 요금제 정보 조회
      const plan = await Plans.findByPk(planId)
      if (!plan) throw new ApiError(404, '요금제를 찾을 수 없습니다.')

      // 약정기간(dis)이 12 또는 24면 월 분할, 아니면 전체 금액
      let total_fee = plan.finalPrice
      let monthly_fee = plan.finalPrice
      let endDate = null
      const startDate = new Date()
      if (plan.dis === '12' || plan.dis === '24') {
         const months = Number(plan.dis)
         monthly_fee = Math.ceil(total_fee / months)
         // endDate: startDate 기준 12/24개월 후 (YYYY-MM-DD 포맷)
         let tempEnd = new Date(startDate)
         tempEnd.setMonth(tempEnd.getMonth() + months)
         endDate = yearMonthDay(tempEnd)
      }

      // UserPlan 생성 (status: pending)
      const userPlan = await UserPlan.create({
         userId,
         planId,
         total_fee,
         monthly_fee,
         status: 'pending',
         startDate,
         endDate,
      })

      // Surveys에 데이터 생성 (planId로 plans 값 불러오기)
      if (plan) {
         await Surveys.create({
            planId: plan.id,
            voice: plan.voice,
            data: plan.data,
            sms: plan.sms,
            age: plan.age,
            type: plan.type,
            dis: plan.dis,
         })
      }

      // 요금제의 agencyId로 알림 생성
      const { Notifications } = require('../models')
      if (plan.agencyId) {
         await Notifications.create({
            title: '새 요금제 가입 신청',
            message: `${plan.name} 요금제에 가입 신청이 들어왔습니다.`,
            type: 'NEW_SERVICE',
            targetUserType: 'AGENCY',
            agencyId: plan.agencyId,
         })
      }

      res.status(201).json({ status: 'success', data: userPlan })
   } catch (error) {
      next(error)
   }
}

// [GET] /user-plans - 내 요금제 목록 조회
exports.getMyUserPlans = async (req, res, next) => {
   try {
      const userId = req.user.id
      let userPlans = await UserPlan.findAll({
         where: { userId },
         include: [
            { model: User, as: 'user', attributes: ['id'] },
            { model: Plans, as: 'plan' },
            { model: Transactions, as: 'transactions', required: false },
         ],
         order: [['createdAt', 'DESC']],
      })

      // 실시간 만료 처리: endDate가 오늘 이전이고 status가 active/pending이면 expired로 변경
      const today = new Date()
      const expiredPlans = []
      for (const plan of userPlans) {
         if (plan.endDate && ['active', 'pending'].includes(plan.status) && new Date(plan.endDate) < today) {
            plan.status = 'expired'
            await plan.save()
            expiredPlans.push(plan.id)
         }
      }

      // 최신 상태로 다시 조회 (만료 반영)
      if (expiredPlans.length > 0) {
         userPlans = await UserPlan.findAll({
            where: { userId },
            include: [
               { model: User, as: 'user', attributes: ['id'] },
               { model: Plans, as: 'plan' },
               { model: Transactions, as: 'transactions', required: false },
            ],
            order: [['createdAt', 'DESC']],
         })
      }

      res.json({ status: 'success', data: userPlans })
   } catch (error) {
      next(error)
   }
}

// [GET] /user-plans/bill - 내 요금제 청구서(가장 최근 active/pending)
exports.getMyUserPlanBill = async (req, res, next) => {
   try {
      const userId = req.user.id
      // 가장 최근 active, pending, expired 요금제 1건
      const userPlan = await UserPlan.findOne({
         where: {
            userId,
            status: { [Op.in]: ['active', 'pending', 'expired'] },
         },
         include: [
            { model: User, as: 'user', attributes: ['id'] },
            { model: Plans, as: 'plan' },
            { model: Transactions, as: 'transactions', required: false },
         ],
         order: [['createdAt', 'DESC']],
      })
      if (!userPlan) return res.status(404).json({ message: '청구할 요금제 내역이 없습니다.' })

      // Plan에서 요금제 이름
      const planName = userPlan.plan?.name || null
      // UserPlan에서 상태, startDate
      const status = userPlan.status
      const startDate = userPlan.startDate

      // Transactions에서 결제 정보 (1:1 관계)
      let transaction = null
      const tx = userPlan.transactions
      if (tx) {
         transaction = {
            amount: tx.amount,
            date: tx.date,
            paymentMethod: tx.paymentMethod,
         }
         if (tx.isInstallment) {
            transaction.installmentMonths = tx.installmentMonths
            transaction.installmentAmount = tx.installmentAmount
         }
      }

      res.json({
         status: 'success',
         data: {
            planName,
            status,
            startDate,
            transaction,
         },
      })
   } catch (error) {
      next(error)
   }
}

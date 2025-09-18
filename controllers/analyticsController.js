const { ServiceAnalytics, AdditionalServices, Agency } = require('../models')
const { User, Transactions, Plans, UserPlan } = require('../models')
const ApiError = require('../utils/apiError')
const { Op, where } = require('sequelize')
const { nowDateMinus, yearMonthDay, dayLeft, dayMinusDay } = require('../utils/dateSet')

exports.getHomeStatus = async (req, res, next) => {
   try {
      const sevnDaysAgo = nowDateMinus(1)

      const totalUsers = await User.count()
      const totalRevenue = await Transactions.sum('amount', {
         where: {
            status: 'success',
         },
      })
      const newUsers = await User.count({
         where: {
            createdAt: {
               [Op.gte]: sevnDaysAgo,
            },
         },
      })
      const transactionsCount = await Transactions.count()
      const averageOrder = totalRevenue / transactionsCount
      const recentOrdersData = await Transactions.findAll({
         order: [['date', 'DESC']],
         limit: 8,
         attributes: ['amount', 'status', 'date', 'id'],
         include: [
            {
               model: User,
               as: 'user',
               attributes: ['name'],
            },
            {
               model: UserPlan,
               as: 'userPlan',
               include: {
                  model: Plans,
                  as: 'plan',
                  attributes: ['name'],
               },
            },
         ],
      })
      const recentOrders = recentOrdersData.map((transaction) => {
         const date = yearMonthDay(transaction.date)
         return {
            id: transaction.id,
            userName: transaction.user.name,
            planName: transaction.userPlan?.plan?.name,
            totalAmount: transaction.amount,
            status: transaction.status,
            date,
         }
      })

      const data = {
         totalUsers: totalUsers || 0,
         totalRevenue: totalRevenue || 0,
         newUsers: newUsers || 0,
         averageOrder: averageOrder || 0,
         recentOrders: recentOrders || null,
      }

      res.status(200).json({
         success: true,
         data,
         message: '데이터를 가져왔어요',
      })
   } catch (error) {
      next(error)
   }
}

exports.getUserStatus = async (req, res, next) => {
   try {
      const page = req.query.page || 1
      const offset = (page - 1) * 10
      const filter = req.query.filter || ''

      let whereClause = {}
      if (filter) {
         whereClause = {
            [Op.or]: [{ phone: { [Op.like]: `%${filter}%` } }, { email: { [Op.like]: `%${filter}%` } }, { name: { [Op.like]: `%${filter}%` } }],
         }
      }

      const { count: totalCount, rows: users } = await User.findAndCountAll({
         limit: 10,
         offset: offset,
         order: [['createdAt', 'DESC']],
         where: whereClause,
      })

      const totalPages = Math.ceil(totalCount / 10)

      const userPromises = users.map(async (user) => {
         const createdAt = yearMonthDay(user.createdAt)
         const orderCount = await Transactions.count({
            where: {
               userId: user.id,
               status: 'success',
            },
         })
         return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            createdAt,
            orderCount: orderCount || 0,
            status: user.access,
         }
      })

      const data = await Promise.all(userPromises)

      res.status(200).json({
         success: true,
         data,
         totalPages,
         message: '데이터를 가져왔어요',
      })
   } catch (error) {
      console.log(`에러가 났네요. ${error}`)
      next(error)
   }
}

exports.getPlansStatus = async (req, res, next) => {
   try {
      const page = req.query.page || 1
      const offset = (page - 1) * 8
      const filter = req.query.filter || ''

      let whereClause = {}
      if (filter) {
         whereClause = {
            [Op.or]: [{ type: { [Op.like]: `%${filter}%` } }],
         }
      }

      const { count: totalCount, rows: plans } = await Plans.findAndCountAll({
         limit: 8,
         offset: offset,
         order: [['createdAt', 'DESC']],
         where: whereClause,
      })

      const totalPages = Math.ceil(totalCount / 8)

      const planPromises = plans.map(async (plan) => {
         const createdAt = yearMonthDay(plan.createdAt)
         let carrier = 'null'
         switch (plan.type) {
            case '2':
               carrier = '3G'
               break
            case '3':
               carrier = 'LTE'
               break
            case '6':
               carrier = '5G'
               break
         }
         const featuresArray = JSON.parse(plan.benefits)
         return {
            id: plan.id,
            name: plan.name,
            carrier,
            data: plan.data,
            voice: plan.voice,
            sms: plan.sms,
            price: plan.basePrice,
            discountRate: plan.discountAmount,
            status: plan.status,
            features: featuresArray,
            createdAt,
         }
      })

      const data = await Promise.all(planPromises)

      res.status(200).json({
         success: true,
         data,
         totalPages,
         message: '데이터를 가져왔어요',
      })
   } catch (error) {
      next(error)
   }
}

exports.getOrdersStatus = async (req, res, next) => {
   try {
      const page = parseInt(req.query.page) || 1
      const offset = (page - 1) * 4
      const filterName = req.query.filterName || ''
      const filterStatus = req.query.filterStatus || ''

      let whereClause = {}
      const whereConditions = []

      if (filterName) {
         whereConditions.push({
            [Op.or]: [{ '$user.name$': { [Op.like]: `%${filterName}%` } }, { '$user.email$': { [Op.like]: `%${filterName}%` } }, { '$userPlan.plan.name$': { [Op.like]: `%${filterName}%` } }],
         })
      }

      if (filterStatus) {
         whereConditions.push({ status: filterStatus })
      }

      whereClause = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {}

      const { count: totalCount, rows: transactions } = await Transactions.findAndCountAll({
         limit: 4,
         offset: offset,
         order: [['createdAt', 'DESC']],
         where: whereClause,
         include: [
            {
               model: User,
               as: 'user',
               required: true,
            },
            {
               model: UserPlan,
               as: 'userPlan',
               required: true,
               include: {
                  model: Plans,
                  as: 'plan',
                  required: true,
               },
            },
         ],
         subQuery: false,
      })

      const totalPages = Math.ceil(totalCount / 4)

      const transactionsPromises = transactions.map(async (transaction) => {
         const orderDate = yearMonthDay(transaction.createdAt)
         let carrier = 'null'
         switch (transaction.userPlan.plan.type) {
            case '2':
               carrier = '3G'
               break
            case '3':
               carrier = 'LTE'
               break
            case '6':
               carrier = '5G'
               break
         }
         const featuresArray = JSON.parse(transaction.userPlan.plan.benefits)

         const leftDate = dayMinusDay(transaction.userPlan.endDate, transaction.userPlan.startDate)

         let point = 0
         if (leftDate >= 24) point = 1000
         else if (leftDate >= 12) point = 500

         return {
            id: transaction.id,
            customerName: transaction.user.name,
            customerEmail: transaction.user.email,
            customerPhone: transaction.user.phone,
            planName: transaction.userPlan?.plan?.name,
            planCarrier: carrier,
            originalPrice: transaction.userPlan.total_fee,
            amount: transaction.userPlan.total_fee,
            discountRate: 25,
            cardCompany: transaction.paymentMethod,
            status: transaction.status,
            orderDate,
            completedDate: transaction.date,
            usePoint: 0,
            earnedPoint: point,
            contract: `${leftDate}개월`,
            features: featuresArray,
         }
      })

      const data = await Promise.all(transactionsPromises)

      res.status(200).json({
         success: true,
         data,
         totalPages,
         message: '데이터를 가져왔어요',
      })
   } catch (error) {
      next(error)
   }
}

exports.getUserDetail = async (req, res, next) => {
   try {
      const userId = req.query.id
      const userDetail = await User.findOne({
         where: { id: userId },
      })

      res.status(200).json({
         success: true,
         userDetail,
         message: '데이터를 가져왔어요',
      })
   } catch (error) {
      next(error)
   }
}

exports.putPlanStatus = async (req, res, next) => {
   try {
      const planId = req.query.id
      const plan = await Plans.findOne({
         where: { id: planId },
      })
      if (!plan) {
         throw new ApiError(400, '요금제를 찾지 못했습니다.')
      }

      const prevStatus = plan.status
      const newStatus = req.query.status
      await plan.update({
         status: newStatus,
      })

      // 상태 변경 알림: status가 변경된 경우에만 알림 전송
      if (newStatus && prevStatus !== newStatus) {
         try {
            const agency = await Agency.findByPk(plan.agencyId)
            if (agency) {
               const userId = agency.userId
               const Notifications = require('../models').Notifications
               let message = ''
               let title = '요금제 상태 변경'
               let type = 'SYSTEM'
               let targetUserType = 'AGENCY'
               if (newStatus === 'active') message = `[${plan.name}] 요금제가 승인되었습니다.`
               else if (newStatus === 'inactive') message = `[${plan.name}] 요금제가 거절되었습니다.`
               else if (newStatus === 'pending') message = `[${plan.name}] 요금제가 승인 대기중입니다.`
               if (message) {
                  await Notifications.create({
                     title,
                     message,
                     type,
                     agencyId: agency.id,
                     userId,
                     isRead: false,
                     targetUserType,
                  })
               }
            }
         } catch (e) {
            console.error('알림 전송 실패:', e?.message, e?.stack)
         }
      }

      res.status(200).json({
         success: true,
         message: '데이터를 수정했어요',
      })
   } catch (error) {
      next(error)
   }
}

exports.getServiceStats = async (req, res, next) => {
   try {
      const { startDate, endDate, serviceId, agencyId } = req.query
      const where = {}

      // 날짜 필터
      if (startDate && endDate) {
         where.period = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
         }
      }

      // 서비스 필터
      if (serviceId) {
         where.serviceId = serviceId
      }

      // 관리자/유저 분기 처리
      const userOrAdmin = req.user || req.admin
      if (!userOrAdmin) {
         return res.status(401).json({ success: false, message: '인증 정보 없음' })
      }

      // 통신사 필터 (관리자만 전체 조회 가능)
      if (req.admin) {
         // 관리자: agencyId 쿼리 파라미터가 있으면 해당 통신사만, 없으면 전체
         if (agencyId) {
            where.agencyId = agencyId
         }
      } else if (req.user) {
         // 일반 유저: 본인 소속 통신사만 (agencyId가 있을 때만)
         if (req.user.agencyId) {
            where.agencyId = req.user.agencyId
         } else {
            // agencyId가 없으면 빈 결과 반환
            return res.status(200).json({
               status: 'success',
               data: {
                  stats: [],
                  summary: { totalViews: 0, totalPurchases: 0, totalRevenue: 0 },
               },
            })
         }
      }

      const stats = await ServiceAnalytics.findAll({
         where,
         include: [
            {
               model: AdditionalServices,
               as: 'service',
               attributes: ['name', 'price', 'category'],
            },
            {
               model: Agency,
               as: 'agency',
               attributes: ['name', 'code'],
            },
         ],
         order: [['period', 'DESC']],
      })

      // 총계 계산
      const summary = stats.reduce(
         (acc, curr) => {
            acc.totalViews += curr.viewCount
            acc.totalPurchases += curr.purchaseCount
            acc.totalRevenue += Number(curr.totalRevenue)
            return acc
         },
         { totalViews: 0, totalPurchases: 0, totalRevenue: 0 }
      )

      res.status(200).json({
         status: 'success',
         data: {
            stats,
            summary,
         },
      })
   } catch (error) {
      next(error)
   }
}

// 서비스 조회수 증가
exports.incrementViewCount = async (req, res, next) => {
   try {
      const { serviceId } = req.params
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [analytics] = await ServiceAnalytics.findOrCreate({
         where: {
            serviceId,
            period: today,
         },
         defaults: {
            agencyId: req.user.agencyId,
            viewCount: 1,
         },
      })

      if (analytics) {
         await analytics.increment('viewCount')
      }

      res.status(200).json({
         status: 'success',
         message: '조회수가 증가되었습니다.',
      })
   } catch (error) {
      next(error)
   }
}

// 서비스 구매 통계 업데이트
exports.updatePurchaseStats = async (req, res, next) => {
   try {
      const { serviceId } = req.params
      const { purchaseAmount } = req.body
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [analytics] = await ServiceAnalytics.findOrCreate({
         where: {
            serviceId,
            period: today,
         },
         defaults: {
            agencyId: req.user.agencyId,
            purchaseCount: 1,
            totalRevenue: purchaseAmount,
         },
      })

      if (analytics) {
         await analytics.increment({
            purchaseCount: 1,
            totalRevenue: purchaseAmount,
         })
      }

      res.status(200).json({
         status: 'success',
         message: '구매 통계가 업데이트되었습니다.',
      })
   } catch (error) {
      next(error)
   }
}

const { ServiceAnalytics, AdditionalServices, Agency } = require('../models')
const User = require('../models/User')
const ApiError = require('../utils/apiError')
const { Op } = require('sequelize')

exports.getTotalUsers = async (req, res, next) => {
   try {
      const totalUsers = await User.count()

      res.status(200).json({
         success: true,
         total: totalUsers,
         message: '총 사용자 수를 성공적으로 가져왔습니다.',
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

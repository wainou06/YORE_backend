const { Notification, Agency, AdditionalServices } = require('../models')
const ApiError = require('../utils/apiError')
const { Op } = require('sequelize')

/**
 * 알림 목록 조회
 */
exports.getNotifications = async (req, res, next) => {
   try {
      const { page = 1, limit = 10 } = req.query
      const offset = (page - 1) * limit

      const where = {}
      // 일반 사용자는 자신의 알림만 조회
      if (!req.user.isAdmin) {
         where.userId = req.user.id
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
         where,
         include: [
            {
               model: Agency,
               as: 'agency',
               attributes: ['id', 'agencyName'],
            },
         ],
         order: [['createdAt', 'DESC']],
         offset,
         limit: parseInt(limit),
      })

      res.status(200).json({
         status: 'success',
         data: {
            notifications,
            pagination: {
               total: count,
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
            },
         },
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 읽지 않은 알림 개수 조회
 */
exports.getUnreadCount = async (req, res, next) => {
   try {
      const count = await Notification.count({
         where: {
            userId: req.user.id,
            isRead: false,
         },
      })

      res.status(200).json({
         status: 'success',
         data: { count },
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 단일 알림 읽음 처리
 */
exports.markAsRead = async (req, res, next) => {
   try {
      const { id } = req.params
      const notification = await Notification.findByPk(id)

      if (!notification) {
         throw new ApiError(404, '알림을 찾을 수 없습니다.')
      }

      if (notification.userId !== req.user.id && !req.user.isAdmin) {
         throw new ApiError(403, '접근 권한이 없습니다.')
      }

      await notification.update({ isRead: true })

      res.status(200).json({
         status: 'success',
         data: notification,
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 모든 알림 읽음 처리
 */
exports.markAllAsRead = async (req, res, next) => {
   try {
      await Notification.update(
         { isRead: true },
         {
            where: {
               userId: req.user.id,
               isRead: false,
            },
         }
      )

      res.status(200).json({
         status: 'success',
         message: '모든 알림이 읽음 처리되었습니다.',
      })
   } catch (error) {
      next(error)
   }
}

/**
 * 단일 알림 생성
 * 관리자: 모든 유형의 알림 생성 가능
 * 통신사: 자신의 서비스에 대한 알림만 생성 가능
 */
exports.createNotification = async (req, res, next) => {
   try {
      const { title, message, type, targetUserType, agencyId, serviceId } = req.body

      // 입력값 검증
      if (!title || !message || !type || !targetUserType) {
         throw new ApiError(400, '필수 입력값이 누락되었습니다.')
      }

      // 권한 검증
      if (!req.user?.isAdmin) {
         // 전체 알림은 관리자만 생성 가능
         if (targetUserType === 'ALL') {
            throw new ApiError(403, '전체 알림 생성 권한이 없습니다.')
         }

         // 통신사는 자신의 서비스에 대한 알림만 생성 가능
         if (agencyId && agencyId !== req.user.agencyId) {
            throw new ApiError(403, '다른 통신사의 알림을 생성할 수 없습니다.')
         }
      }

      const notification = await Notification.create({
         title,
         message,
         type,
         targetUserType,
         agencyId: agencyId || req.user?.agencyId,
         serviceId,
         isRead: false,
      })

      const result = await Notification.findByPk(notification.id, {
         include: [
            {
               model: Agency,
               as: 'agency',
               attributes: ['id', 'name'],
            },
            {
               model: AdditionalServices,
               as: 'service',
               attributes: ['id', 'name'],
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
 * 일괄 알림 생성 (관리자 전용)
 * 여러 개의 알림을 한 번에 생성
 */
exports.createBulkNotifications = async (req, res, next) => {
   try {
      const { notifications } = req.body

      // 관리자 권한 검증
      if (!req.user?.isAdmin) {
         throw new ApiError(403, '일괄 알림 생성 권한이 없습니다.')
      }

      // 입력값 검증
      if (!Array.isArray(notifications) || notifications.length === 0) {
         throw new ApiError(400, '유효한 알림 목록이 필요합니다.')
      }

      // 각 알림의 필수 필드 검증
      notifications.forEach((notification, index) => {
         const { title, message, type, targetUserType } = notification
         if (!title || !message || !type || !targetUserType) {
            throw new ApiError(400, `${index + 1}번째 알림의 필수 입력값이 누락되었습니다.`)
         }
      })

      const createdNotifications = await Notification.bulkCreate(
         notifications.map((notification) => ({
            ...notification,
            isRead: false,
            createdAt: new Date(),
         }))
      )

      const result = await Notification.findAll({
         where: {
            id: {
               [Op.in]: createdNotifications.map((n) => n.id),
            },
         },
         include: [
            {
               model: Agency,
               as: 'agency',
               attributes: ['id', 'name'],
            },
            {
               model: AdditionalServices,
               as: 'service',
               attributes: ['id', 'name'],
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

const { Notifications, User, Agency } = require('../models')

// 알림 생성 (관리자/통신사만)
exports.createNotification = async (req, res) => {
   try {
      const { title, message, type, targetUserType, userId, agencyId } = req.body
      // 권한 체크: 관리자 또는 통신사만 생성 가능
      if (!['admin', 'agency'].includes(req.user.access)) {
         return res.status(403).json({ message: '권한이 없습니다.' })
      }
      // 필수값 체크
      if (!title || !message || !type || !targetUserType) {
         return res.status(400).json({ message: '필수값 누락' })
      }
      // 알림 생성
      const notification = await Notifications.create({
         title,
         message,
         type,
         targetUserType,
         userId: userId || null,
         agencyId: agencyId || null,
      })
      res.status(201).json(notification)
   } catch (err) {
      res.status(500).json({ message: err.message })
   }
}

// 알림 목록 조회 (userId 또는 agencyId)
exports.getNotifications = async (req, res) => {
   try {
      const { user, admin } = req
      console.log(`확인: ${JSON.stringify(admin)}`)
      let where = {}
      if (user.access === 'user') {
         where.userId = user.id
      } else if (user.access === 'agency') {
         // 항상 Agency 모델에서 userId로 agencyId 조회
         const agency = await Agency.findOne({ where: { userId: user.id } })
         if (agency && agency.id) {
            where.agencyId = agency.id
         } else {
            // 소속된 agency가 없으면 빈 배열 반환
            return res.json([])
         }
      } else if (admin) {
         // 관리자는 전체 또는 targetUserType: 'ADMIN' 알림
         where.targetUserType = 'ADMIN'
      }
      const notifications = await Notifications.findAll({
         where,
         order: [['createdAt', 'DESC']],
         include: [
            { model: User, as: 'user' },
            { model: Agency, as: 'agency' },
         ],
      })
      res.json(notifications)
   } catch (err) {
      console.error('[알림 목록 조회 오류]', err)
      res.status(500).json({ message: err.message, stack: err.stack })
   }
}

// 알림 읽음 처리 (본인만)
exports.markAsRead = async (req, res) => {
   try {
      const { id } = req.params
      const notification = await Notifications.findByPk(id)
      if (!notification) return res.status(404).json({ message: '알림 없음' })
      // 본인 알림만 읽음 처리
      if (req.user.access === 'user' && notification.userId !== req.user.id) {
         return res.status(403).json({ message: '권한 없음' })
      }
      notification.isRead = true
      await notification.save()
      res.json({ message: '읽음 처리 완료' })
   } catch (err) {
      res.status(500).json({ message: err.message })
   }
}

// (선택) 알림 삭제
exports.deleteNotification = async (req, res) => {
   try {
      const { id } = req.params
      const notification = await Notifications.findByPk(id)
      if (!notification) return res.status(404).json({ message: '알림 없음' })

      const user = req.user
      // 관리자: 전체 삭제 가능
      if (user.access === 'admin') {
         await notification.destroy()
         return res.json({ message: '삭제 완료' })
      }
      // 통신사: 본인 소속 알림만 삭제 가능
      if (user.access === 'agency' && notification.agencyId === user.agency?.id) {
         await notification.destroy()
         return res.json({ message: '삭제 완료' })
      }
      // 사용자: 본인 알림만 삭제 가능
      if (user.access === 'user' && notification.userId === user.id) {
         await notification.destroy()
         return res.json({ message: '삭제 완료' })
      }
      // 그 외: 권한 없음
      return res.status(403).json({ message: '권한 없음' })
   } catch (err) {
      res.status(500).json({ message: err.message })
   }
}

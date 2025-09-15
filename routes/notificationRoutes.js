const express = require('express')
const notificationController = require('../controllers/notificationController')
const { isAuthenticated } = require('../middlewares/authMiddleware')

const router = express.Router()

// 알림 생성 (관리자/통신사만)
router.post('/', isAuthenticated, notificationController.createNotification)

// 알림 목록 조회 (로그인 사용자)
router.get('/', isAuthenticated, notificationController.getNotifications)

// 알림 읽음 처리 (본인만)
router.patch('/:id/read', isAuthenticated, notificationController.markAsRead)

// 알림 삭제 (관리자/통신사만)
router.delete('/:id', isAuthenticated, notificationController.deleteNotification)

module.exports = router

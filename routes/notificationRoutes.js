const express = require('express')
const notificationController = require('../controllers/notificationController')
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')

const router = express.Router()

// 알림 생성 (관리자 및 통신사)
router.post('/', isAuthenticated, notificationController.createNotification)

// 알림 목록 조회 (권한별 필터링)
router.get('/', isAuthenticated, notificationController.getNotifications)

// 읽지 않은 알림 개수 조회
router.get('/unread-count', isAuthenticated, notificationController.getUnreadCount)

// 알림 읽음 처리
router.patch('/:id/read', isAuthenticated, notificationController.markAsRead)

// 모든 알림 읽음 처리
router.patch('/read-all', isAuthenticated, notificationController.markAllAsRead)

// 특정 타입의 알림만 조회
router.get('/type/:type', isAuthenticated, notificationController.getNotifications)

// 특정 서비스의 알림만 조회
router.get('/services/:serviceId', isAuthenticated, notificationController.getNotifications)

// 특정 통신사의 알림만 조회 (관리자용)
router.get('/agencies/:agencyId', isAuthenticated, isAdmin, notificationController.getNotifications)

module.exports = router

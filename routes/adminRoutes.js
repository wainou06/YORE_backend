const express = require('express')
const router = express.Router()
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')
const adminController = require('../controllers/adminController')

// 모든 관리자 라우트에 인증 및 관리자 권한 검사 미들웨어 적용
router.use(isAuthenticated)
router.use(isAdmin)

// 사용자 관리
router.get('/users', adminController.getAllUsers)
router.get('/users/:id', adminController.getUser)
router.patch('/users/:id/status', adminController.updateUserStatus)
router.patch('/users/:id/role', adminController.updateUserStatus)

// 통계
router.get('/statistics', adminController.getStatistics)

// 로그 내보내기
router.get('/logs/export', adminController.exportLogs)

module.exports = router

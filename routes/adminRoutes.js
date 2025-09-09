const express = require('express')
const router = express.Router()
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')
const adminController = require('../controllers/adminController')

//관리자 등록 (초기 관리자 계정 생성용, 실제 운영시에는 제거 필요)
router.post('/register', adminController.registerAdmin)

//관리자 로그인

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

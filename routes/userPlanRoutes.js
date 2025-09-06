const express = require('express')
const router = express.Router()
const { isAuthenticated, isAdmin } = require('../middlewares/auth')
const { subscriptionLimiter } = require('../middlewares/rateLimiter')
const userPlanController = require('../controllers/userPlanController')

const env = process.env.NODE_ENV || 'development'

// 사용자 플랜 생성 (구독 시작)
router.post('/', subscriptionLimiter(env), isAuthenticated, userPlanController.createUserPlan)

// 사용자 플랜 목록 조회
router.get('/', isAuthenticated, userPlanController.getUserPlans)

// 사용자 플랜 상세 조회
router.get('/:id', isAuthenticated, userPlanController.getUserPlan)

// 사용자 플랜 취소
router.post('/:id/cancel', isAuthenticated, userPlanController.cancelUserPlan)

module.exports = router

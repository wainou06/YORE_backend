const express = require('express')
const router = express.Router()
const { isAuthenticated } = require('../middlewares/authMiddleware')
const { subscriptionLimiter } = require('../middlewares/rateLimiter')
const userPlanController = require('../controllers/userPlanController')

const env = process.env.NODE_ENV || 'development'

// 내 요금제 목록 조회
router.get('/', isAuthenticated, userPlanController.getMyUserPlans)
// 내 요금제 청구서
router.get('/bill', isAuthenticated, userPlanController.getMyUserPlanBill)
// 사용자 플랜 생성 (구독 시작)
router.post('/', subscriptionLimiter(env), isAuthenticated, userPlanController.createUserPlan)

module.exports = router

const express = require('express')
const router = express.Router()
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')
const { subscriptionLimiter } = require('../middlewares/rateLimiter')
const userPlanController = require('../controllers/userPlanController')

const env = process.env.NODE_ENV || 'development'

// 사용자 플랜 생성 (구독 시작)
router.post('/', subscriptionLimiter(env), isAuthenticated, userPlanController.createUserPlan)

module.exports = router

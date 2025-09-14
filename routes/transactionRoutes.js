const express = require('express')
const transactionController = require('../controllers/transactionController')
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')
const { paymentLimiter } = require('../middlewares/rateLimiter')

const router = express.Router()
const env = process.env.NODE_ENV || 'development'

// 결제 생성
router.post('/', paymentLimiter(env), isAuthenticated, transactionController.createTransaction)

module.exports = router

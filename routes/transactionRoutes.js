const express = require('express')
const transactionController = require('../controllers/transactionController')
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')
const { paymentLimiter } = require('../middlewares/rateLimiter')

const router = express.Router()
const env = process.env.NODE_ENV || 'development'

// 결제 생성
router.post('/', paymentLimiter(env), isAuthenticated, transactionController.createTransaction)

// 결제 목록 조회
router.get('/', isAuthenticated, transactionController.getTransactions)

// 결제 상세 조회
router.get('/:id', isAuthenticated, transactionController.getTransaction)

// 결제 취소/환불
router.post('/:id/refund', isAuthenticated, transactionController.refundTransaction)

module.exports = router

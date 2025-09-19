const express = require('express')
const transactionController = require('../controllers/transactionController')
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware')
const { paymentLimiter } = require('../middlewares/rateLimiter')

const router = express.Router()
const env = process.env.NODE_ENV || 'development'

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: 결제 생성
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               userPlanId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               isInstallment:
 *                 type: boolean
 *               installmentMonths:
 *                 type: integer
 *               installmentAmount:
 *                 type: number
 *               transactionId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               forceActivate:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 결제 생성 성공
 *       400:
 *         description: 필수 결제 정보 누락
 *       404:
 *         description: UserPlan 없음
 */
router.post('/', paymentLimiter(env), isAuthenticated, transactionController.createTransaction)

module.exports = router

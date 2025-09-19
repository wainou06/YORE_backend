const express = require('express')
const router = express.Router()
const { isAuthenticated } = require('../middlewares/authMiddleware')
const { subscriptionLimiter } = require('../middlewares/rateLimiter')
const userPlanController = require('../controllers/userPlanController')

const env = process.env.NODE_ENV || 'development'

/**
 * @swagger
 * /user-plans:
 *   get:
 *     summary: 내 요금제 목록 조회
 *     tags: [UserPlans]
 *     responses:
 *       200:
 *         description: 내 요금제 목록 반환
 */
router.get('/', isAuthenticated, userPlanController.getMyUserPlans)

/**
 * @swagger
 * /user-plans/bill:
 *   get:
 *     summary: 내 요금제 청구서 조회
 *     tags: [UserPlans]
 *     responses:
 *       200:
 *         description: 내 요금제 청구서 반환
 *       404:
 *         description: 청구할 요금제 내역 없음
 */
router.get('/bill', isAuthenticated, userPlanController.getMyUserPlanBill)

/**
 * @swagger
 * /user-plans:
 *   post:
 *     summary: 사용자 플랜 생성 (구독 시작)
 *     tags: [UserPlans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               planId:
 *                 type: integer
 *               selectedServiceIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: 사용자 플랜 생성 성공
 *       400:
 *         description: 필수값 누락 또는 중복 가입
 *       404:
 *         description: 요금제 없음
 */
router.post('/', subscriptionLimiter(env), isAuthenticated, userPlanController.createUserPlan)

module.exports = router

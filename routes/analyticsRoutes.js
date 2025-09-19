const express = require('express')
const analyticsController = require('../controllers/analyticsController')
const { isAuthenticated, isAdmin, isAgency } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(isAuthenticated)
router.use(isAdmin)

/**
 * @swagger
 * /analytics/getHomeStatus:
 *   get:
 *     summary: 홈 상태 조회
 *     description: 홈 상태 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 홈 상태 데이터
 */
router.get('/getHomeStatus', analyticsController.getHomeStatus)
/**
 * @swagger
 * /analytics/getUserStatus:
 *   get:
 *     summary: 사용자 상태 조회
 *     description: 사용자 상태 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 사용자 상태 데이터
 */
router.get('/getUserStatus', analyticsController.getUserStatus)
/**
 * @swagger
 * /analytics/getPlansStatus:
 *   get:
 *     summary: 플랜 상태 조회
 *     description: 플랜 상태 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 플랜 상태 데이터
 */
router.get('/getPlansStatus', analyticsController.getPlansStatus)
/**
 * @swagger
 * /analytics/getOrdersStatus:
 *   get:
 *     summary: 주문 상태 조회
 *     description: 주문 상태 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 주문 상태 데이터
 */
router.get('/getOrdersStatus', analyticsController.getOrdersStatus)
/**
 * @swagger
 * /analytics/getUserDetail:
 *   get:
 *     summary: 사용자 상세 정보 조회
 *     description: 특정 사용자의 상세 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 사용자 상세 정보
 */
router.get('/getUserDetail', analyticsController.getUserDetail)

/**
 * @swagger
 * /analytics/putPlanStatus:
 *   put:
 *     summary: 플랜 상태 수정
 *     description: 플랜 상태를 수정합니다.
 *     responses:
 *       200:
 *         description: 플랜 상태가 성공적으로 수정되었습니다.
 */
router.put('/putPlanStatus', analyticsController.putPlanStatus)

// 전체 통계 조회 (관리자 및 통신사)

router.get('/', isAuthenticated, analyticsController.getServiceStats)

// 서비스별 상세 통계 조회
/**
 * @swagger
 * /analytics/services/{serviceId}:
 *   get:
 *     summary: 서비스별 상세 통계 조회
 *     description: 특정 서비스의 상세 통계를 조회합니다.
 *     parameters:
 *       - name: serviceId
 *         in: path
 *         required: true
 *         description: 서비스 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 서비스별 통계 데이터
 */
router.get('/services/:serviceId', isAuthenticated, analyticsController.getServiceStats)

// 통신사별 통계 조회 (관리자용)
/**
 * @swagger
 * /analytics/agencies/{agencyId}:
 *   get:
 *     summary: 통신사별 통계 조회 (관리자용)
 *     description: 특정 통신사의 상세 통계를 조회합니다.
 *     parameters:
 *       - name: agencyId
 *         in: path
 *         required: true
 *         description: 통신사 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 통신사별 통계 데이터
 */
router.get('/agencies/:agencyId', isAuthenticated, isAdmin, analyticsController.getServiceStats)

// 기간별 통계 조회
/**
 * @swagger
 * /analytics/period:
 *   get:
 *     summary: 기간별 통계 조회
 *     description: 특정 기간의 통계 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 기간별 통계 데이터
 */
router.get('/period', isAuthenticated, analyticsController.getServiceStats)

// 조회수 증가
/**
 * @swagger
 * /analytics/{serviceId}/view:
 *   post:
 *     summary: 조회수 증가
 *     description: 특정 서비스의 조회수를 증가시킵니다.
 *     parameters:
 *       - name: serviceId
 *         in: path
 *         required: true
 *         description: 서비스 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 조회수 증가 성공
 */
router.post('/:serviceId/view', isAuthenticated, analyticsController.incrementViewCount)

// 구매 통계 업데이트

/**
 * @swagger
 * /analytics/{serviceId}/purchase:
 *   post:
 *     summary: 구매 통계 업데이트
 *     description: 특정 서비스의 구매 통계를 업데이트합니다.
 *     parameters:
 *       - name: serviceId
 *         in: path
 *         required: true
 *         description: 서비스 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 구매 통계 업데이트 성공
 */
router.post('/:serviceId/purchase', isAuthenticated, analyticsController.updatePurchaseStats)

module.exports = router

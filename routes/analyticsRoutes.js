const express = require('express')
const analyticsController = require('../controllers/analyticsController')
const { isAuthenticated, isAdmin, isAgency } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(isAuthenticated)
router.use(isAdmin)

router.get('/getHomeStatus', analyticsController.getHomeStatus)
router.get('/getUserStatus', analyticsController.getUserStatus)

// 전체 통계 조회 (관리자 및 통신사)
router.get('/', isAuthenticated, analyticsController.getServiceStats)

// 서비스별 상세 통계 조회
router.get('/services/:serviceId', isAuthenticated, analyticsController.getServiceStats)

// 통신사별 통계 조회 (관리자용)
router.get('/agencies/:agencyId', isAuthenticated, isAdmin, analyticsController.getServiceStats)

// 기간별 통계 조회
router.get('/period', isAuthenticated, analyticsController.getServiceStats)

// 조회수 증가
router.post('/:serviceId/view', isAuthenticated, analyticsController.incrementViewCount)

// 구매 통계 업데이트
router.post('/:serviceId/purchase', isAuthenticated, analyticsController.updatePurchaseStats)

module.exports = router

const express = require('express')
const router = express.Router()
const planController = require('../controllers/planController')
const { isAuthenticated, optionalAuth } = require('../middlewares/authMiddleware')
const { upload } = require('../utils/fileUpload')

// 요금제 생성 (관리자/통신사만)
router.post(
   '/',
   isAuthenticated,
   (req, res, next) => {
      if (req.user?.access === 'agency' || req.admin) {
         return next()
      }
      return res.status(403).json({ message: '권한이 없습니다.' })
   },
   upload.array('images'),
   planController.createPlan
)

// 요금제 목록 조회 (권한별 분기)
router.get('/', optionalAuth, planController.getPlans)

// 특정 요금제 상세 조회
router.get('/:id', planController.getPlanById)

// 요금제 수정 (관리자/통신사만)
router.put(
   '/:id',
   isAuthenticated,
   (req, res, next) => {
      if (req.user?.access === 'agency' || req.admin) return next()
      return res.status(403).json({ message: '권한이 없습니다.' })
   },
   upload.array('images'),
   planController.updatePlan
)

// 요금제 삭제 (관리자/통신사만)
router.delete(
   '/:id',
   isAuthenticated,
   (req, res, next) => {
      if (req.user?.access === 'agency' || req.admin) return next()
      return res.status(403).json({ message: '권한이 없습니다.' })
   },
   planController.deletePlan
)

module.exports = router

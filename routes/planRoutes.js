const express = require('express')
const router = express.Router()
const planController = require('../controllers/planController')
const { isAuthenticated, optionalAuth } = require('../middlewares/authMiddleware')
const { upload } = require('../utils/fileUpload')

/**
 * @swagger
 * /plans:
 *   post:
 *     summary: 요금제 생성 (관리자/통신사만)
 *     tags: [Plans]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: images
 *         type: file
 *         description: 요금제 이미지 파일들
 *       - in: formData
 *         name: planData
 *         type: string
 *         description: 요금제 데이터(JSON 문자열)
 *     responses:
 *       201:
 *         description: 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       403:
 *         description: 권한 없음
 */
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

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: 요금제 목록 조회 (권한별 분기)
 *     tags: [Plans]
 *     parameters:
 *       - in: query
 *         name: agencyId
 *         schema:
 *           type: integer
 *         description: 통신사 ID
 *     responses:
 *       200:
 *         description: 요금제 목록 반환
 */
router.get('/', optionalAuth, planController.getPlans)

/**
 * @swagger
 * /plans/{id}:
 *   get:
 *     summary: 특정 요금제 상세 조회
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 요금제 ID
 *     responses:
 *       200:
 *         description: 요금제 상세 정보 반환
 *       404:
 *         description: 요금제 없음
 */
router.get('/:id', planController.getPlanById)

/**
 * @swagger
 * /plans/{id}:
 *   put:
 *     summary: 요금제 수정 (관리자/통신사만)
 *     tags: [Plans]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 요금제 ID
 *       - in: formData
 *         name: images
 *         type: file
 *         description: 요금제 이미지 파일들
 *       - in: formData
 *         name: planData
 *         type: string
 *         description: 요금제 데이터(JSON 문자열)
 *     responses:
 *       200:
 *         description: 수정 성공
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 요금제 없음
 */
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

/**
 * @swagger
 * /plans/{id}:
 *   delete:
 *     summary: 요금제 삭제 (관리자/통신사만)
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 요금제 ID
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 요금제 없음
 */
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

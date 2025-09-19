const express = require('express')
const router = express.Router()
const agencyController = require('../controllers/agencyController')

/**
 * @swagger
 * /agencies/by-user/{userId}:
 *   get:
 *     summary: 특정 사용자(userId)로 통신사 조회
 *     tags: [Agencies]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 통신사 정보 반환
 *       404:
 *         description: 통신사 없음
 */
router.get('/by-user/:userId', agencyController.getAgencyByUserId)

/**
 * @swagger
 * /agencies:
 *   get:
 *     summary: 전체 통신사 목록 조회
 *     tags: [Agencies]
 *     responses:
 *       200:
 *         description: 전체 통신사 목록 반환
 */
router.get('/', agencyController.getAllAgencies)

module.exports = router

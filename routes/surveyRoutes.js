const express = require('express')
const router = express.Router()
const surveyController = require('../controllers/surveyController')

/**
 * @swagger
 * /surveys:
 *   get:
 *     summary: 전체 설문 리스트 조회
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: 설문 리스트 반환
 */
router.get('/', surveyController.getSurveys)

module.exports = router

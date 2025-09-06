const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const surveyController = require('../controllers/surveyController')
const { validate } = require('../middlewares/validateMiddleware')

const surveyValidation = [
   body('voice').notEmpty().withMessage('통화량을 입력해주세요.').matches(/^\d+$/).withMessage('통화량은 숫자만 입력 가능합니다.'),
   body('data').notEmpty().withMessage('데이터 사용량을 입력해주세요.').matches(/^\d+$/).withMessage('데이터 사용량은 숫자만 입력 가능합니다.'),
   body('sms').notEmpty().withMessage('문자 발송량을 입력해주세요.').matches(/^\d+$/).withMessage('문자 발송량은 숫자만 입력 가능합니다.'),
   body('age').notEmpty().withMessage('연령대를 선택해주세요.').isIn(['20', '18', '65']).withMessage('유효하지 않은 연령대입니다.'),
   body('type').notEmpty().withMessage('서비스 타입을 선택해주세요.').isIn(['2', '3', '6']).withMessage('유효하지 않은 서비스 타입입니다.'),
   body('dis').notEmpty().withMessage('약정기간을 선택해주세요.').isIn(['0', '12', '24']).withMessage('유효하지 않은 약정기간입니다.'),
]

router.post('/', validate(surveyValidation), surveyController.submitSurvey)
router.get('/:id', surveyController.getSurveyResults)

module.exports = router

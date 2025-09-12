console.log('authRoutes loaded')

const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const authController = require('../controllers/authController')
const { isAuthenticated } = require('../middlewares/authMiddleware')
const { validate } = require('../middlewares/validateMiddleware')
const refreshController = require('../controllers/refreshController')

// 토큰 리프레시
router.post('/refresh', refreshController.refresh)

const loginValidation = [body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.'), body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.')]

const registerValidation = [
   body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.'),
   body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
   body('name').notEmpty().withMessage('이름을 입력해주세요.'),
   body('userid').notEmpty().withMessage('사용자 ID를 입력해주세요.'),
]

const updateProfileValidation = [
   body('name').optional().notEmpty().withMessage('이름을 입력해주세요.'),
   body('phone')
      .optional()
      .matches(/^[0-9]{10,11}$/)
      .withMessage('올바른 전화번호 형식이 아닙니다.'),
]

const updateAgencyValidation = [body('agencyName').optional().notEmpty().withMessage('기업명을 입력해주세요.'), body('managerName').optional().notEmpty().withMessage('담당자명을 입력해주세요.')]

const changePasswordValidation = [
   body('currentPassword').notEmpty().withMessage('현재 비밀번호를 입력해주세요.'),
   body('newPassword').isLength({ min: 6 }).withMessage('새 비밀번호는 최소 6자 이상이어야 합니다.'),
   body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
         throw new Error('비밀번호가 일치하지 않습니다.')
      }
      return true
   }),
]

// 인증 라우트
router.post('/login', validate(loginValidation), authController.login)
router.post('/register', validate(registerValidation), authController.register)
router.post('/logout', isAuthenticated, authController.logout)

// 프로필 관련 라우트
router.get('/profile', isAuthenticated, authController.getProfile)
router.put('/profile', isAuthenticated, validate(updateProfileValidation), authController.updateProfile)
router.put('/profile/agency', isAuthenticated, validate(updateAgencyValidation), authController.updateAgencyProfile)
router.put('/profile/password', isAuthenticated, validate(changePasswordValidation), authController.changePassword)

router.post('/change-password', isAuthenticated, authController.changePassword)
router.post('/change-email', isAuthenticated, authController.changeEmail)
router.post('/change-birth', isAuthenticated, authController.changeBirth)

// 카카오 가능 라우트 추가
router.get('/kakao/callback', authController.kakaoCallback)

module.exports = router

console.log('authRoutes loaded')

const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const authController = require('../controllers/authController')
const { isAuthenticated } = require('../middlewares/authMiddleware')
const { validate } = require('../middlewares/validateMiddleware')

const loginValidation = [body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.'), body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.')]

const registerValidation = [
   body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.'),
   body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
   body('name').notEmpty().withMessage('이름을 입력해주세요.'),
   body('userid').notEmpty().withMessage('사용자 ID를 입력해주세요.'),
]

router.post('/login', validate(loginValidation), authController.login)
router.post('/register', validate(registerValidation), authController.register)
router.get('/profile', isAuthenticated, authController.getProfile)

module.exports = router

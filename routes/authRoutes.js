const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const authController = require('../controllers/authController')
const { isAuthenticated } = require('../middlewares/authMiddleware')
const { validate } = require('../middlewares/validateMiddleware')
const refreshController = require('../controllers/refreshController')

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
   body('confirmPassword')
      .optional()
      .custom((value, { req }) => {
         if (value && value !== req.body.newPassword) {
            throw new Error('비밀번호가 일치하지 않습니다.')
         }
         return true
      }),
]

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 로그인
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자 이메일
 *               password:
 *                 type: string
 *                 description: 비밀번호 (최소 6자)
 *               userType:
 *                 type: string
 *                 enum: [personal, business]
 *                 description: 사용자 유형 (personal=개인회원, business=기업회원)
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT 토큰 (1시간 유효)
 *                 user:
 *                   type: object
 *                   description: 로그인한 사용자 정보
 *       401:
 *         description: 로그인 실패 (잘못된 계정/비밀번호 또는 잘못된 사용자 유형)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/login', validate(loginValidation), authController.login)

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 회원가입
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - userid
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자의 이메일
 *               password:
 *                 type: string
 *                 description: 비밀번호 (최소 6자)
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               userid:
 *                 type: string
 *                 description: 사용자 ID
 *               phone:
 *                 type: string
 *                 description: 연락처 (선택)
 *               access:
 *                 type: string
 *                 enum: [user, agency]
 *                 description: 회원 유형 (user=개인, agency=기업)
 *               agency:
 *                 type: object
 *                 description: 기업회원인 경우 사업자 정보
 *                 properties:
 *                   businessNumber:
 *                     type: string
 *                     description: 사업자 등록 번호
 *                   companyName:
 *                     type: string
 *                     description: 회사명
 *                   address:
 *                     type: string
 *                     description: 회사 주소
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   description: 생성된 사용자 정보 (비밀번호 제외)
 *                 agency:
 *                   type: object
 *                   description: 생성된 기업 정보 (기업회원일 경우)
 *       400:
 *         description: 요청 유효성 오류 또는 중복 데이터 존재
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/register', validate(registerValidation), authController.register)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 로그아웃 되었습니다.
 *       401:
 *         description: 인증 실패 (로그인 필요)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 로그인이 필요합니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 발생
 */
router.post('/logout', isAuthenticated, authController.logout)

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: 내 프로필 조회
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     userid:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     access:
 *                       type: string
 *                       example: user
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     agency:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         agencyName:
 *                           type: string
 *                         businessNumber:
 *                           type: string
 *                         managerName:
 *                           type: string
 *       401:
 *         description: 인증 실패 (로그인 필요)
 *       404:
 *         description: 사용자 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/profile', isAuthenticated, authController.getProfile)

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: 내 프로필 수정
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               phone:
 *                 type: string
 *                 description: 전화번호 (10~11자리)
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     userid:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     access:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 유효성 검사 실패
 *       401:
 *         description: 인증 실패 (로그인 필요)
 *       500:
 *         description: 서버 오류
 */
router.put('/profile', isAuthenticated, validate(updateProfileValidation), authController.updateProfile)

/**
 * @swagger
 * /auth/profile/agency:
 *   put:
 *     summary: 기업회원 프로필 수정
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agencyName:
 *                 type: string
 *                 description: 회사명
 *               businessNumber:
 *                 type: string
 *                 description: 사업자 등록 번호
 *               managerName:
 *                 type: string
 *                 description: 담당자 이름
 *     responses:
 *       200:
 *         description: 기업 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 기업 정보가 수정되었습니다.
 *                 agency:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     agencyName:
 *                       type: string
 *                     businessNumber:
 *                       type: string
 *                     managerName:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: 기업회원만 접근 가능
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: 기업 정보 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.put('/profile/agency', isAuthenticated, validate(updateAgencyValidation), authController.updateAgencyProfile)

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: 비밀번호 변경
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 현재 비밀번호
 *               newPassword:
 *                 type: string
 *                 description: 새 비밀번호 (최소 6자)
 *               confirmPassword:
 *                 type: string
 *                 description: 새 비밀번호 확인
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 비밀번호가 변경되었습니다.
 *       400:
 *         description: 현재 비밀번호 불일치 또는 새 비밀번호 확인 불일치
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 현재 비밀번호가 일치하지 않습니다.
 *       404:
 *         description: 사용자 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 발생
 */
router.post('/change-password', isAuthenticated, validate(changePasswordValidation), authController.changePassword)

/**
 * @swagger
 * /auth/change-email:
 *   post:
 *     summary: 이메일 변경
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 새 이메일 주소
 *     responses:
 *       200:
 *         description: 이메일 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 이메일 변경 완료
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *       400:
 *         description: 이메일 미입력 또는 이미 존재하는 이메일
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 이미 존재하는 이메일입니다.
 *       404:
 *         description: 사용자 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 발생
 */
router.post('/change-email', isAuthenticated, authController.changeEmail)

/**
 * @swagger
 * /auth/change-birth:
 *   post:
 *     summary: 생일 변경
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - birth
 *             properties:
 *               birth:
 *                 type: string
 *                 format: date
 *                 description: 새 생일 (YYYY-MM-DD 형식)
 *     responses:
 *       200:
 *         description: 생일 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 생일이 업데이트되었습니다.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     birth:
 *                       type: string
 *                       format: date
 *       400:
 *         description: 생일 미입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 생일이 필요합니다.
 *       404:
 *         description: 사용자 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 발생
 */
router.post('/change-password', isAuthenticated, validate(changePasswordValidation), authController.changePassword)
router.post('/change-email', isAuthenticated, validate([body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.')]), authController.changeEmail)
router.post('/change-birth', isAuthenticated, authController.changeBirth)

/**
 * @swagger
 * /auth/kakao/callback:
 *   get:
 *     summary: 카카오 OAuth 로그인 콜백
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 카카오 인가 코드
 *     responses:
 *       302:
 *         description: 프론트엔드로 리다이렉트 (로그인 성공)
 *         headers:
 *           Location:
 *             description: JWT 토큰 및 사용자 이름이 쿼리로 포함된 프론트엔드 URL
 *             schema:
 *               type: string
 *               example: "https://frontend.example.com/auth/kakao/callback?token=JWT_TOKEN&name=USERNAME"
 *       400:
 *         description: 인가 코드 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 인가 코드 없음
 *       500:
 *         description: 서버 오류 또는 카카오 API 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 발생
 */
router.get('/kakao/callback', authController.kakaoCallback)

/**
 * @swagger
 * /auth/find-password:
 *   post:
 *     summary: 비밀번호 찾기 (임시 비밀번호 발급)
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - value
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [email, phone]
 *                 description: 사용자 확인 방법
 *                 example: email
 *               value:
 *                 type: string
 *                 description: 이메일 또는 전화번호
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: 임시 비밀번호 발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tempPassword:
 *                   type: string
 *                   example: a1b2c3d4
 *       404:
 *         description: 사용자 미존재
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 해당 사용자가 존재하지 않습니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 서버 오류 발생
 */
router.post('/find-password', authController.findPassword)

module.exports = router

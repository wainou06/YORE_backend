const axios = require('axios')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const path = require('path')
const session = require('express-session')
const passport = require('passport')
const dotenv = require('dotenv')

const passportConfig = require('./passport')
const authRoutes = require('./routes/authRoutes')
const surveyRoutes = require('./routes/surveyRoutes')
const planRoutes = require('./routes/planRoutes')
const serviceRoutes = require('./routes/serviceRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const userPlanRoutes = require('./routes/userPlanRoutes')
const transactionRoutes = require('./routes/transactionRoutes')
const adminRoutes = require('./routes/adminRoutes')
const errorMiddleware = require('./middlewares/errorMiddleware')

const { createOrUpdateUser, generateJWT } = require('./utils/auth')

dotenv.config()
const app = express()

// CORS 설정
app.use(
   cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
   })
)

// 기본 미들웨어 설정
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Passport 설정
passportConfig()

// API 라우트
app.use('/admin', adminRoutes)

// Middleware
app.use(helmet())

// 정적 파일 제공 설정
app.use(
   '/uploads',
   express.static(path.join(__dirname, 'uploads'), {
      // 한글 파일명 처리를 위한 설정
      setHeaders: (res, filePath) => {
         const filename = path.basename(filePath)
         const encodedFilename = encodeURIComponent(filename)
         res.setHeader('Content-Disposition', `inline; filename="${encodedFilename}"`)
      },
   })
)
app.use(
   cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
   })
)
// morgan은 에러 상황에만 로그를 남기도록 설정
app.use(
   morgan('dev', {
      skip: function (req, res) {
         return res.statusCode < 400
      },
      stream: {
         write: function (message) {
            // morgan의 로그를 콘솔에 직접 출력하지 않고 무시
         },
      },
   })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session & Passport 설정
app.use(
   session({
      secret: process.env.COOKIE_SECRET || 'yoreuserkey',
      resave: false,
      saveUninitialized: false,
      cookie: {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
      },
   })
)

app.use(passport.initialize())
app.use(passport.session())

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 카카오 콜백 처리
authRoutes.get('/kakao/callback', async (req, res) => {
   const code = req.query.code
   if (!code) return res.status(400).send('인가 코드 없음')

   try {
      // 1. 카카오 토큰 발급
      const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
         params: {
            grant_type: 'authorization_code',
            client_id: process.env.KAKAO_CLIENT_ID,
            redirect_uri: process.env.KAKAO_REDIRECT_URI,
            code,
         },
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const accessToken = tokenResponse.data.access_token

      // 2. 카카오 사용자 정보 요청
      const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
         headers: { Authorization: `Bearer ${accessToken}` },
      })

      console.log(userResponse.data)

      const kakaoUser = userResponse.data
      console.log(kakaoUser)

      const tempEmail = kakaoUser.id + '@kakao.com'
      const name = kakaoUser.kakao_account.profile.nickname

      // 3. DB 처리: 신규 회원이면 생성, 기존 회원이면 업데이트
      const user = await createOrUpdateUser({
         userid: `kakao_${kakaoUser.id}`,
         email: tempEmail,
         name,
         // provider: 'kakao',
      })

      // 4. JWT 발급 후 프론트로 redirect
      const token = generateJWT(user)
      console.log('Generated JWT:', token)
      res.redirect(`${process.env.FRONTEND_URL}/auth/kakao/callback?token=${token}&name=${encodeURIComponent(name)}`)
   } catch (error) {
      console.error(error.response?.data || error)
      res.redirect(`${process.env.FRONTEND_URL}/auth/kakao/fail`)
   }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/surveys', surveyRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/user-plans', userPlanRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/admin', adminRoutes)

// Error handling
app.use(errorMiddleware)

module.exports = app

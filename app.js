const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./utils/swagger')

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
const analyticsRoutes = require('./routes/analyticsRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const userPlanRoutes = require('./routes/userPlanRoutes')
const transactionRoutes = require('./routes/transactionRoutes')
const adminRoutes = require('./routes/adminRoutes')
const userServicesRoutes = require('./routes/userServicesRoutes')
const agencyRoutes = require('./routes/agencyRoutes')
const errorMiddleware = require('./middlewares/errorMiddleware')

const { createOrUpdateUser, generateJWT } = require('./utils/auth')

dotenv.config()
const app = express()

app.use(
   cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
   })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

passportConfig()

app.use(
   '/uploads',
   cors(),
   express.static(path.join(__dirname, 'uploads'), {
      setHeaders: (res, filePath) => {
         const filename = path.basename(filePath)
         const encodedFilename = encodeURIComponent(filename)
         res.setHeader('Content-Disposition', `inline; filename="${encodedFilename}"`)
         res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      },
   })
)
app.use(
   cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
   })
)
app.use(
   morgan('dev', {
      skip: function (req, res) {
         return res.statusCode < 400
      },
      stream: {
         write: function (message) {},
      },
   })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

app.use(
   helmet({
      contentSecurityPolicy: {
         directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", `${process.env.APP_API_URL}`],
            imgSrc: ["'self'", 'data:', `${process.env.APP_API_URL}`, `${process.env.FRONTEND_URL}`],
         },
      },
   })
)

app.use(passport.initialize())
app.use(passport.session())

authRoutes.get('/kakao/callback', async (req, res) => {
   const code = req.query.code
   if (!code) return res.status(400).send('인가 코드 없음')

   try {
      const tokenResponse = await axios.post(`${process.env.KAKAO_OAUTH_URL}`, null, {
         params: {
            grant_type: 'authorization_code',
            client_id: process.env.KAKAO_CLIENT_ID,
            redirect_uri: process.env.KAKAO_REDIRECT_URI,
            code,
         },
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const accessToken = tokenResponse.data.access_token

      const userResponse = await axios.get(`${process.env.KAKAO_API_URL}`, {
         headers: { Authorization: `Bearer ${accessToken}` },
      })

      const kakaoUser = userResponse.data

      const tempEmail = kakaoUser.id + '@kakao.com'
      const name = kakaoUser.kakao_account.profile.nickname

      const user = await createOrUpdateUser({
         userid: `kakao_${kakaoUser.id}`,
         email: tempEmail,
         name,
      })

      const token = generateJWT(user)
      res.redirect(`${process.env.FRONTEND_URL}/auth/kakao/callback?token=${token}&name=${encodeURIComponent(name)}`)
   } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/kakao/fail`)
   }
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/auth', authRoutes)
app.use('/agencies', agencyRoutes)
app.use('/surveys', surveyRoutes)
app.use('/plans', planRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/notifications', notificationRoutes)
app.use('/user-plans', userPlanRoutes)
app.use('/transactions', transactionRoutes)
app.use('/admin', adminRoutes)
app.use('/user-services', userServicesRoutes)

app.use(errorMiddleware)

module.exports = app

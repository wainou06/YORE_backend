const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const path = require('path')
const session = require('express-session')
const passport = require('passport')
require('dotenv').config()

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

const app = express()

// Passport 설정
passportConfig()

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
app.use(morgan('dev'))
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

const app = require('./app')
const { sequelize } = require('./models')
const logger = require('./utils/logger')
const path = require('path')
const fs = require('fs')
const seed = require('./scripts/seed')
const { runBirthdayCouponScheduler } = require('./utils/scheduler') // 생일쿠폰 자동 지급 스케줄러 연결

// uploads 디렉토리 생성
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
   fs.mkdirSync(uploadsDir, { recursive: true })
   logger.info('uploads 디렉토리가 생성되었습니다.')
}

const PORT = process.env.PORT || 3000

async function startServer() {
   try {
      await sequelize.authenticate()
      logger.info('Database connection has been established successfully.')

      // 개발/배포 환경 모두 DB 동기화 및 시드 실행
      await sequelize.sync({ force: false, alter: false })
      logger.info('Database synchronized')
      await seed()

      app.listen(PORT, () => {
         logger.info(`Server is running on port ${PORT}`)
         runBirthdayCouponScheduler()
      })
   } catch (error) {
      logger.error('Unable to connect to the database:', error)
      process.exit(1)
   }
}

startServer()

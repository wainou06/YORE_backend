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

      // Sync database in development mode
      if (process.env.NODE_ENV === 'development') {
         await sequelize.sync({ force: false })
         logger.info('Database synchronized')
         // DB 동기화 후 기본 데이터 시드
         await seed()
      }

      app.listen(PORT, () => {
         logger.info(`Server is running on port ${PORT}`)
         // 개발 환경에서 서버 시작 시 생일쿠폰 지급 테스트 실행
         if (process.env.NODE_ENV === 'development') {
            runBirthdayCouponScheduler()
         }
      })
   } catch (error) {
      logger.error('Unable to connect to the database:', error)
      process.exit(1)
   }
}

startServer()

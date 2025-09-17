const app = require('./app')
const { sequelize } = require('./models')
const logger = require('./utils/logger')
const path = require('path')
const fs = require('fs')
const seed = require('./scripts/seed')

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
      })
   } catch (error) {
      logger.error('Unable to connect to the database:', error)
      process.exit(1)
   }
}

startServer()

const app = require('./app')
const { sequelize } = require('./models')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 3000

async function startServer() {
   try {
      await sequelize.authenticate()
      logger.info('Database connection has been established successfully.')

      // Sync database in development mode
      if (process.env.NODE_ENV === 'development') {
         await sequelize.sync({ alter: true })
         logger.info('Database synchronized')
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

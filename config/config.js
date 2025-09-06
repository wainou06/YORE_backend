require('dotenv').config()

module.exports = {
   development: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT,
      logging: console.log,
   },
   test: {
      username: process.env.TEST_DB_USERNAME,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_NAME,
      host: process.env.TEST_DB_HOST,
      dialect: process.env.TEST_DB_DIALECT,
      logging: false,
   },
   production: {
      username: process.env.DEPLOY_DB_USERNAME,
      password: process.env.DEPLOY_DB_PASSWORD,
      database: process.env.DEPLOY_DB_NAME,
      host: process.env.DEPLOY_DB_HOST,
      dialect: process.env.DEPLOY_DB_DIALECT,
      logging: false,
      pool: {
         max: 5,
         min: 0,
         acquire: 30000,
         idle: 10000,
      },
   },
}

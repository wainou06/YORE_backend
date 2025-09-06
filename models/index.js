const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const config = require('../config/config.js')[process.env.NODE_ENV || 'development']

const db = {}

const sequelize = new Sequelize(config.database, config.username, config.password, {
   host: config.host,
   port: config.port,
   dialect: config.dialect,
   logging: config.logging,
   timezone: '+09:00', // 한국 시간대 설정
   pool: config.pool,
})

// 현재 디렉토리의 모든 모델 파일들을 자동으로 import
fs.readdirSync(__dirname)
   .filter((file) => {
      return file.indexOf('.') !== 0 && file !== path.basename(__filename) && file.slice(-3) === '.js'
   })
   .forEach((file) => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
      db[model.name] = model
   })

// 모델 간의 관계 설정
Object.keys(db).forEach((modelName) => {
   if (db[modelName].associate) {
      db[modelName].associate(db)
   }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db

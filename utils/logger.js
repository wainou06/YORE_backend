const winston = require('winston')
const path = require('path')

const logger = winston.createLogger({
   level: 'info',
   format: winston.format.combine(
      winston.format.timestamp({
         format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.json()
   ),
   transports: [
      // 에러 레벨 로그는 error.log 파일에 저장
      new winston.transports.File({
         filename: path.join(__dirname, '../logs/error.log'),
         level: 'error',
      }),
      // 모든 레벨의 로그는 combined.log 파일에 저장
      new winston.transports.File({
         filename: path.join(__dirname, '../logs/combined.log'),
      }),
   ],
})

// 개발 환경에서는 콘솔에도 로그 출력
if (process.env.NODE_ENV !== 'production') {
   logger.add(
      new winston.transports.Console({
         format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      })
   )
}

module.exports = logger

const winston = require('winston')
const path = require('path')

const logger = winston.createLogger({
   level: 'error', // 에러 레벨만 로깅
   format: winston.format.combine(
      winston.format.timestamp({
         format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.printf(({ level, message, timestamp }) => {
         return `${timestamp} ${level}: ${message}`
      })
   ),
   transports: [
      // 에러 레벨 로그는 error.log 파일에 저장
      new winston.transports.File({
         filename: path.join(__dirname, '../logs/error.log'),
         level: 'error',
      }),
      // 콘솔 출력 (에러만)
      new winston.transports.Console({
         format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
         level: 'info',
      }),
   ],
})

module.exports = logger

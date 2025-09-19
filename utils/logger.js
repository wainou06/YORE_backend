const winston = require('winston')
const path = require('path')

const logger = winston.createLogger({
   level: 'info', // info 이상 모두 기록
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
      // info 이상 로그는 combined.log 파일에도 저장
      new winston.transports.File({
         filename: path.join(__dirname, '../logs/combined.log'),
         level: 'info',
      }),
      // 콘솔 출력 (info 이상)
      new winston.transports.Console({
         format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
         level: 'info',
      }),
   ],
})

module.exports = logger

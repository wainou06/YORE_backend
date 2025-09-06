const logger = require('../utils/logger')

const errorMiddleware = (err, req, res, next) => {
   logger.error(err.stack)

   // Sequelize 에러 처리
   if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
         success: false,
         message: '입력값 검증 실패',
         errors: err.errors.map((e) => ({
            field: e.path,
            message: e.message,
         })),
      })
   }

   if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
         success: false,
         message: '중복된 값이 존재합니다',
         errors: err.errors.map((e) => ({
            field: e.path,
            message: e.message,
         })),
      })
   }

   // JWT 에러 처리
   if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
         success: false,
         message: '유효하지 않은 토큰입니다.',
      })
   }

   // 기본 에러 응답
   res.status(err.status || 500).json({
      success: false,
      message: err.message || '서버 내부 오류가 발생했습니다.',
   })
}

module.exports = errorMiddleware

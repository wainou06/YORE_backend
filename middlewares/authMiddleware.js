const jwt = require('jsonwebtoken')
const { User } = require('../models')

// 기본 인증 미들웨어
exports.isAuthenticated = async (req, res, next) => {
   try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(401).json({
            success: false,
            message: '토큰이 제공되지 않았습니다.',
         })
      }

      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      const user = await User.findOne({
         where: { id: decoded.id },
         attributes: { exclude: ['password'] },
      })

      if (!user) {
         return res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.',
         })
      }

      req.user = user
      next()
   } catch (error) {
      if (error.name === 'TokenExpiredError') {
         return res.status(401).json({
            success: false,
            message: '토큰이 만료되었습니다.',
         })
      }
      return res.status(401).json({
         success: false,
         message: '유효하지 않은 토큰입니다.',
      })
   }
}

// 관리자 권한 확인
exports.isAdmin = (req, res, next) => {
   if (!req.user || req.user.access !== 'admin') {
      return res.status(403).json({
         success: false,
         message: '관리자만 접근할 수 있습니다.',
      })
   }
   next()
}

// 통신사 권한 확인
exports.isAgency = (req, res, next) => {
   if (!req.user || req.user.access !== 'agency' || !req.user.agencyId) {
      return res.status(403).json({
         success: false,
         message: '통신사만 접근할 수 있습니다.',
      })
   }
   next()
}

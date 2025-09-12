const jwt = require('jsonwebtoken')
const { User, Agency, Admin } = require('../models')

// 기본 인증 미들웨어 (사용자/관리자 토큰 분리)
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

      // 관리자 토큰: 'admin_' prefix 사용 (프론트/백엔드 모두 적용 필요)
      if (token.startsWith('admin_')) {
         const realToken = token.replace('admin_', '')
         const decoded = jwt.verify(realToken, process.env.JWT_SECRET)
         const admin = await Admin.findOne({ where: { id: decoded.id } })
         if (!admin) {
            return res.status(401).json({
               success: false,
               message: '유효하지 않은 관리자 토큰입니다.',
            })
         }
         req.admin = admin
         return next()
      }

      // 일반 사용자 토큰
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
      return next()
   } catch (error) {
      if (error.name === 'TokenExpiredError') {
         return res.status(401).json({
            success: false,
            message: '토큰이 만료되었습니다.',
         })
      }
      return res.status(401).json({
         success: false,
         message: '인증에 실패했습니다.',
      })
   }
}

// 관리자 권한 확인
exports.isAdmin = (req, res, next) => {
   if (!req.admin) {
      return res.status(403).json({
         success: false,
         message: '관리자만 접근할 수 있습니다.',
      })
   }
   next()
}

// 통신사 권한 확인
exports.isAgency = async (req, res, next) => {
   try {
      if (!req.user || req.user.access !== 'agency') {
         return res.status(403).json({
            success: false,
            message: '통신사만 접근할 수 있습니다.',
         })
      }

      // 통신사 정보 확인
      const agency = await Agency.findOne({ where: { userId: req.user.id } })
      if (!agency) {
         return res.status(403).json({
            success: false,
            message: '등록된 통신사 정보가 없습니다.',
         })
      }

      // 통신사 정보를 req 객체에 추가
      req.agency = agency
      next()
   } catch (error) {
      return res.status(500).json({
         success: false,
         message: '서버 오류가 발생했습니다.',
      })
   }
}

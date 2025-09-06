const authService = require('../services/authService')
const logger = require('../utils/logger')

exports.login = async (req, res, next) => {
   try {
      const { email, password } = req.body
      const result = await authService.login(email, password)

      res.json({
         success: true,
         message: '로그인 성공',
         data: result,
      })
   } catch (error) {
      logger.error('Login error:', error)
      next(error)
   }
}

exports.register = async (req, res, next) => {
   try {
      const userData = req.body
      const result = await authService.register(userData)

      res.status(201).json({
         success: true,
         message: '회원가입 성공',
         data: result,
      })
   } catch (error) {
      logger.error('Register error:', error)
      next(error)
   }
}

exports.getProfile = async (req, res) => {
   res.json({
      success: true,
      data: req.user,
   })
}

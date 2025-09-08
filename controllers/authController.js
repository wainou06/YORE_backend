const authService = require('../services/authService')
const logger = require('../utils/logger')

const { User } = require('../models')

exports.register = async (req, res) => {
   try {
      const { email, password, name, userid, phone } = req.body

      const existingUser = await User.findOne({ where: { email } })
      if (existingUser) {
         return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' })
      }

      const existingUserid = await User.findOne({ where: { userid } })
      if (existingUserid) {
         return res.status(400).json({ success: false, message: '이미 사용 중인 사용자 ID입니다.' })
      }

      const newUser = await User.create({
         email,
         password,
         name,
         userid,
         phone,
      })

      res.status(201).json({ success: true, message: '회원가입 성공', user: newUser })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

exports.login = async (req, res) => {
   try {
      const { email, password } = req.body

      const user = await User.findOne({ where: { email } })
      if (!user) {
         return res.status(400).json({ success: false, message: '존재하지 않는 사용자입니다.' })
      }

      const isMatch = await user.validatePassword(password)
      if (!isMatch) {
         return res.status(400).json({ success: false, message: '비밀번호가 틀렸습니다.' })
      }

      res.json({ success: true, message: '로그인 성공', user })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

exports.getProfile = async (req, res) => {
   try {
      res.json({ success: true, user: req.user })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

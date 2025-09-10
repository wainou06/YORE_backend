const { User } = require('../models')
const jwt = require('jsonwebtoken')

exports.refresh = async (req, res) => {
   try {
      const { refreshToken } = req.body
      if (!refreshToken) {
         return res.status(400).json({ success: false, message: '리프레시 토큰이 필요합니다.' })
      }
      // 리프레시 토큰 검증
      jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
         if (err) {
            return res.status(401).json({ success: false, message: '유효하지 않은 리프레시 토큰입니다.' })
         }
         const user = await User.findByPk(decoded.id)
         if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
         }
         // 새 액세스 토큰 발급
         const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
         return res.json({ success: true, token })
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

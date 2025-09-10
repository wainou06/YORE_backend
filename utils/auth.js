// utils/auth.js
const { User } = require('../models') // Sequelize User 모델
const jwt = require('jsonwebtoken')

async function createOrUpdateUser({ email, name, provider }) {
   let user = await User.findOne({ where: { email } })

   const userid = email.split('@')[0]

   if (!user) {
      // 신규 회원 생성
      user = await User.create({
         userid,
         email,
         name,
         //  provider,
      })
   } else {
      // 기존 회원이면 provider 또는 name 업데이트
      const updates = {}
      if (!user.name) updates.name = name
      if (!user.userid) updates.userid = userid
      //   if (!user.provider) updates.provider = provider

      if (Object.keys(updates).length > 0) {
         await user.update(updates)
      }
   }

   return user
}

console.log(process.env.JWT_SECRET)

function generateJWT(user) {
   console.log(user)
   return jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// async function findUserByEmail(email) {
//    return await User.findOne({ where: { email } })
// }

module.exports = {
   createOrUpdateUser,
   generateJWT,
   //    findUserByEmail,
}

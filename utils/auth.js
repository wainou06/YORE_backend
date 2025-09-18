const { User } = require('../models')
const jwt = require('jsonwebtoken')

async function createOrUpdateUser({ email, name, provider }) {
   let user = await User.findOne({ where: { email } })

   const userid = email.split('@')[0]

   if (!user) {
      user = await User.create({
         userid,
         email,
         name,
      })
   } else {
      const updates = {}
      if (!user.name) updates.name = name
      if (!user.userid) updates.userid = userid

      if (Object.keys(updates).length > 0) {
         await user.update(updates)
      }
   }

   return user
}

function generateJWT(user) {
   return jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

module.exports = {
   createOrUpdateUser,
   generateJWT,
}

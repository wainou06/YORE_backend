const passport = require('passport')
const { User } = require('../models')
const local = require('./localStrategy')
const jwt = require('./jwtStrategy')

module.exports = () => {
   passport.serializeUser((user, done) => {
      done(null, user.id)
   })

   passport.deserializeUser(async (id, done) => {
      try {
         const user = await User.findOne({
            where: { id },
            attributes: { exclude: ['password'] },
         })
         done(null, user)
      } catch (error) {
         done(error)
      }
   })

   local()
   jwt()
}

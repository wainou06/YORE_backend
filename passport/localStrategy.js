const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { User } = require('../models')

module.exports = () => {
   passport.use(
      new LocalStrategy(
         {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true,
         },
         async (req, email, password, done) => {
            try {
               const user = await User.findOne({
                  where: { email },
               })

               if (!user) {
                  return done(null, false, { message: '존재하지 않는 사용자입니다.' })
               }

               const result = await user.validatePassword(password)
               if (!result) {
                  return done(null, false, { message: '비밀번호가 일치하지 않습니다.' })
               }

               const userWithoutPassword = user.toJSON()
               delete userWithoutPassword.password

               return done(null, userWithoutPassword)
            } catch (error) {
               return done(error)
            }
         }
      )
   )
}

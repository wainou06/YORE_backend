const passport = require('passport')
const { Strategy: JWTStrategy, ExtractJwt } = require('passport-jwt')
const { User } = require('../models')

module.exports = () => {
   passport.use(
      new JWTStrategy(
         {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
         },
         async (jwtPayload, done) => {
            try {
               const user = await User.findOne({
                  where: { id: jwtPayload.id },
                  attributes: { exclude: ['password'] },
               })

               if (!user) {
                  return done(null, false, { message: '사용자를 찾을 수 없습니다.' })
               }

               return done(null, user)
            } catch (error) {
               return done(error)
            }
         }
      )
   )
}

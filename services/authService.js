const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { User } = require('../models')
const { ERROR_MESSAGES } = require('../utils/constants')

class AuthService {
   generateToken(user) {
      return jwt.sign(
         {
            id: user.id,
            access: user.access,
         },
         process.env.JWT_SECRET,
         {
            expiresIn: process.env.JWT_EXPIRES_IN,
         }
      )
   }

   async login(email, password) {
      const user = await User.findOne({
         where: { email },
         attributes: { include: ['password'] },
      })

      if (!user) {
         throw new Error(ERROR_MESSAGES.USER.NOT_FOUND)
      }

      const isValidPassword = await user.validatePassword(password)
      if (!isValidPassword) {
         throw new Error(ERROR_MESSAGES.USER.INVALID_PASSWORD)
      }

      const token = this.generateToken(user)
      const userWithoutPassword = user.toJSON()
      delete userWithoutPassword.password

      return {
         user: userWithoutPassword,
         token,
      }
   }

   async register(userData) {
      const existingUser = await User.findOne({
         where: { email: userData.email },
      })

      if (existingUser) {
         throw new Error(ERROR_MESSAGES.USER.DUPLICATE_EMAIL)
      }

      const user = await User.create(userData)
      const token = this.generateToken(user)

      const userWithoutPassword = user.toJSON()
      delete userWithoutPassword.password

      return {
         user: userWithoutPassword,
         token,
      }
   }

   async validateToken(token) {
      try {
         const decoded = jwt.verify(token, process.env.JWT_SECRET)
         const user = await User.findByPk(decoded.id)

         if (!user) {
            throw new Error(ERROR_MESSAGES.AUTH.INVALID_TOKEN)
         }

         return user
      } catch (error) {
         if (error.name === 'TokenExpiredError') {
            throw new Error(ERROR_MESSAGES.AUTH.TOKEN_EXPIRED)
         }
         throw new Error(ERROR_MESSAGES.AUTH.INVALID_TOKEN)
      }
   }
}

module.exports = new AuthService()

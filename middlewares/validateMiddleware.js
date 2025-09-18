const { validationResult } = require('express-validator')

exports.validate = (validations) => {
   return async (req, res, next) => {
      await Promise.all(validations.map((validation) => validation.run(req)))

      const errors = validationResult(req)
      if (errors.isEmpty()) {
         return next()
      }

      res.status(400).json({
         success: false,
         message: errors.array()[0]?.msg || '입력값 검증 실패',
         errors: errors.array(),
      })
   }
}

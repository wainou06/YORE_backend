const { UserServices, AdditionalServices } = require('../models')
const ApiError = require('../utils/apiError')

// [GET] /user-services?userId=123
exports.getUserServicesByUserId = async (req, res, next) => {
   try {
      const { userId } = req.query
      if (!userId) {
         throw new ApiError(400, 'userId는 필수입니다.')
      }
      // UserServices + AdditionalServices 정보 포함
      const userServices = await UserServices.findAll({
         where: { userId },
         include: [{ model: AdditionalServices, as: 'service' }],
         order: [['createdAt', 'ASC']],
      })
      res.json({ status: 'success', data: userServices })
   } catch (error) {
      next(error)
   }
}

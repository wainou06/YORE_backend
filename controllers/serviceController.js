const { AdditionalServices } = require('../models')
const ApiError = require('../utils/apiError')

// 부가 서비스 생성 (통신사용)
exports.createService = async (req, res, next) => {
   try {
      const serviceData = req.body

      // 모델 필수 필드: name, provider, planId, fee
      if (!serviceData.name || !serviceData.provider || !serviceData.planId || serviceData.fee === undefined) {
         throw new ApiError(400, '서비스 이름, 제공자, 요금제, 요금은 필수입니다.')
      }
      const service = await AdditionalServices.create({
         name: serviceData.name,
         description: serviceData.description,
         provider: serviceData.provider,
         planId: serviceData.planId,
         fee: serviceData.fee,
      })
      res.status(201).json({ status: 'success', data: service })
   } catch (error) {
      next(error)
   }
}

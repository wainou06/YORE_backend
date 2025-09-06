const { AdditionalServices, Agency } = require('../models')
const ApiError = require('../utils/apiError')

// 부가 서비스 생성 (통신사용)
exports.createService = async (req, res, next) => {
   try {
      const serviceData = req.body
      const agencyId = req.user.agencyId

      if (!agencyId) {
         throw new ApiError(403, '통신사 권한이 없습니다.')
      }

      // 필수 필드 검증
      if (!serviceData.name || !serviceData.price) {
         throw new ApiError(400, '서비스 이름과 가격은 필수입니다.')
      }

      const service = await AdditionalServices.create({
         name: serviceData.name,
         description: serviceData.description,
         price: serviceData.price,
         category: serviceData.category,
         agencyId,
         isAvailable: true,
      })

      res.status(201).json({
         status: 'success',
         data: service,
      })
   } catch (error) {
      next(error)
   }
}

// 부가 서비스 목록 조회
exports.getAllServices = async (req, res, next) => {
   try {
      const { category, isAvailable, page = 1, limit = 10 } = req.query
      const offset = (page - 1) * limit
      const where = {}

      if (category) {
         where.category = category
      }

      if (isAvailable !== undefined) {
         where.isAvailable = isAvailable === 'true'
      }

      // 통신사는 자신의 서비스만, 관리자는 모든 서비스 조회 가능
      if (req.user?.agencyId && !req.user?.isAdmin) {
         where.agencyId = req.user.agencyId
      }

      const { count, rows: services } = await AdditionalServices.findAndCountAll({
         where,
         include: [
            {
               model: Agency,
               as: 'agency',
               attributes: ['name', 'code'],
            },
         ],
         offset,
         limit: parseInt(limit),
         order: [['createdAt', 'DESC']],
      })

      res.status(200).json({
         status: 'success',
         data: {
            services,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               totalItems: count,
               itemsPerPage: parseInt(limit),
            },
         },
      })
   } catch (error) {
      next(error)
   }
}

// 특정 부가 서비스 조회
exports.getService = async (req, res, next) => {
   try {
      const { id } = req.params

      const service = await AdditionalServices.findByPk(id)
      if (!service) {
         throw new ApiError(404, '부가 서비스를 찾을 수 없습니다.')
      }

      res.status(200).json({
         status: 'success',
         data: service,
      })
   } catch (error) {
      next(error)
   }
}

// 부가 서비스 수정 (관리자 및 해당 통신사용)
exports.updateService = async (req, res, next) => {
   try {
      const { id } = req.params
      const updateData = req.body

      const service = await AdditionalServices.findByPk(id)
      if (!service) {
         throw new ApiError(404, '부가 서비스를 찾을 수 없습니다.')
      }

      // 권한 검증: 관리자이거나 해당 서비스를 생성한 통신사만 수정 가능
      if (!req.user?.isAdmin && service.agencyId !== req.user?.agencyId) {
         throw new ApiError(403, '해당 서비스를 수정할 권한이 없습니다.')
      }

      // 필수 필드 검증
      if (updateData.name === '' || updateData.price === undefined) {
         throw new ApiError(400, '서비스 이름과 가격은 필수입니다.')
      }

      await service.update(updateData)

      res.status(200).json({
         status: 'success',
         data: service,
      })
   } catch (error) {
      next(error)
   }
}

// 부가 서비스 삭제 (관리자 및 해당 통신사용)
exports.deleteService = async (req, res, next) => {
   try {
      const { id } = req.params

      const service = await AdditionalServices.findByPk(id)
      if (!service) {
         throw new ApiError(404, '부가 서비스를 찾을 수 없습니다.')
      }

      // 권한 검증: 관리자이거나 해당 서비스를 생성한 통신사만 삭제 가능
      if (!req.user?.isAdmin && service.agencyId !== req.user?.agencyId) {
         throw new ApiError(403, '해당 서비스를 삭제할 권한이 없습니다.')
      }

      // 소프트 삭제 (isAvailable만 false로 변경)
      await service.update({ isAvailable: false })

      res.status(204).send()
   } catch (error) {
      next(error)
   }
}

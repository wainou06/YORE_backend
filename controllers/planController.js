const { Plans, PlanImgs, Agency, AdditionalServices, UserServices } = require('../models')
const { validatePlanData } = require('../utils/validators')
const ApiError = require('../utils/apiError')
const { upload, getFileUrl, deleteFile, decodeFilename } = require('../utils/fileUpload')
const path = require('path')

// 요금제 생성 (통신사용)
exports.createPlan = async (req, res, next) => {
   try {
      const planData = req.body
      const agencyId = req.user.agencyId

      if (!agencyId) {
         throw new ApiError(403, '통신사 권한이 없습니다.')
      }

      const validationError = validatePlanData(planData)
      if (validationError) {
         throw new ApiError(400, validationError)
      }

      // 요금제 데이터에서 services와 requiredServices 분리
      const { services, requiredServices, ...planCreateData } = planData

      const plan = await Plans.create({
         ...planCreateData,
         agencyId,
         approvalStatus: 'pending',
         availability: false,
      })

      if (planData.images) {
         const planImgs = planData.images.map((img) => ({
            planId: plan.id,
            url: img.url,
            isMain: img.isMain || false,
         }))
         await PlanImgs.bulkCreate(planImgs)
      }

      // 부가 서비스 연결
      if (planData.services && planData.services.length > 0) {
         // 부가 서비스 ID 배열 유효성 검사
         const services = await AdditionalServices.findAll({
            where: {
               id: planData.services,
               isAvailable: true,
            },
         })

         if (services.length !== planData.services.length) {
            throw new ApiError(400, '유효하지 않은 부가 서비스가 포함되어 있습니다.')
         }

         // 요금제와 부가 서비스 연결
         const planServices = planData.services.map((serviceId) => ({
            planId: plan.id,
            serviceId,
            isRequired: planData.requiredServices?.includes(serviceId) || false,
         }))
         await UserServices.bulkCreate(planServices)
      }

      // 이미지 파일 처리
      if (req.files && req.files.length > 0) {
         const planImgs = req.files.map((file, index) => {
            const today = new Date()
            const datePath = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
            const relativePath = path.join(datePath, file.filename)

            return {
               planId: plan.id,
               imgURL: getFileUrl(relativePath),
               originName: decodeFilename(file.filename),
               mainImg: index === 0 ? 'Y' : 'N', // 첫 번째 이미지를 대표 이미지로 설정
            }
         })

         await PlanImgs.bulkCreate(planImgs)
      }

      // 생성된 요금제 조회 (연결된 정보 포함)
      const createdPlan = await Plans.findByPk(plan.id, {
         include: [
            {
               model: PlanImgs,
               as: 'images',
               attributes: ['url', 'originalName', 'isMain'],
            },
            {
               model: AdditionalServices,
               as: 'services',
               through: { attributes: ['isRequired'] },
               attributes: ['id', 'name', 'description', 'price'],
            },
         ],
      })

      res.status(201).json({
         status: 'success',
         data: createdPlan,
      })
   } catch (error) {
      next(error)
   }
}

// 요금제 승인/반려 (관리자용)
exports.approvePlan = async (req, res, next) => {
   try {
      const { id } = req.params
      const { status, rejectionReason } = req.body

      if (!['approved', 'rejected'].includes(status)) {
         throw new ApiError(400, '잘못된 승인 상태입니다.')
      }

      const plan = await Plans.findByPk(id)
      if (!plan) {
         throw new ApiError(404, '요금제를 찾을 수 없습니다.')
      }

      if (plan.approvalStatus !== 'pending') {
         throw new ApiError(400, '이미 처리된 요금제입니다.')
      }

      await plan.update({
         approvalStatus: status,
         rejectionReason: status === 'rejected' ? rejectionReason : null,
         availability: status === 'approved',
      })

      res.status(200).json({
         status: 'success',
         data: plan,
      })
   } catch (error) {
      next(error)
   }
}

// 요금제 목록 조회
exports.getAllPlans = async (req, res, next) => {
   try {
      const { status, page = 1, limit = 10 } = req.query
      const offset = (page - 1) * limit
      const where = {}

      // 관리자는 모든 상태의 요금제를 볼 수 있음
      if (req.user?.isAdmin) {
         if (status) {
            where.approvalStatus = status
         }
      }
      // 통신사는 자신의 요금제만 볼 수 있음
      else if (req.user?.agencyId) {
         where.agencyId = req.user.agencyId
         if (status) {
            where.approvalStatus = status
         }
      }
      // 일반 사용자는 승인된 요금제만 볼 수 있음
      else {
         where.approvalStatus = 'approved'
         where.availability = true
      }

      const { count, rows: plans } = await Plans.findAndCountAll({
         where,
         include: [
            {
               model: PlanImgs,
               as: 'images',
               attributes: ['url', 'isMain'],
            },
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
            plans,
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

// 특정 요금제 조회
exports.getPlan = async (req, res, next) => {
   try {
      const { id } = req.params

      const plan = await Plans.findOne({
         where: { id },
         include: [
            {
               model: PlanImgs,
               as: 'images',
               attributes: ['url', 'isMain'],
            },
            {
               model: Agency,
               as: 'agency',
               attributes: ['name', 'code'],
            },
         ],
      })

      if (!plan) {
         throw new ApiError(404, '요금제를 찾을 수 없습니다.')
      }

      // 승인되지 않은 요금제는 관리자와 해당 통신사만 조회 가능
      if (plan.approvalStatus !== 'approved' && !req.user?.isAdmin && req.user?.agencyId !== plan.agencyId) {
         throw new ApiError(403, '접근 권한이 없습니다.')
      }

      res.status(200).json({
         status: 'success',
         data: plan,
      })
   } catch (error) {
      next(error)
   }
}

// 요금제 수정
exports.updatePlan = async (req, res, next) => {
   try {
      const { id } = req.params
      const updateData = req.body

      const plan = await Plans.findByPk(id)
      if (!plan) {
         throw new ApiError(404, '요금제를 찾을 수 없습니다.')
      }

      // 통신사는 자신의 요금제만 수정 가능
      if (!req.user.isAdmin && req.user.agencyId !== plan.agencyId) {
         throw new ApiError(403, '수정 권한이 없습니다.')
      }

      // 승인된 요금제를 수정하면 다시 승인 대기 상태로
      if (plan.approvalStatus === 'approved') {
         updateData.approvalStatus = 'pending'
         updateData.availability = false
      }

      const validationError = validatePlanData(updateData)
      if (validationError) {
         throw new ApiError(400, validationError)
      }

      await plan.update(updateData)

      if (updateData.images) {
         await PlanImgs.destroy({ where: { planId: id } })

         if (updateData.images.length > 0) {
            const planImgs = updateData.images.map((img) => ({
               planId: id,
               url: img.url,
               isMain: img.isMain || false,
            }))
            await PlanImgs.bulkCreate(planImgs)
         }
      }

      res.status(200).json({
         status: 'success',
         data: await plan.reload({
            include: [
               {
                  model: PlanImgs,
                  as: 'images',
                  attributes: ['url', 'isMain'],
               },
               {
                  model: Agency,
                  as: 'agency',
                  attributes: ['name', 'code'],
               },
            ],
         }),
      })
   } catch (error) {
      next(error)
   }
}

// 요금제 삭제
exports.deletePlan = async (req, res, next) => {
   try {
      const { id } = req.params

      const plan = await Plans.findByPk(id)
      if (!plan) {
         throw new ApiError(404, '요금제를 찾을 수 없습니다.')
      }

      // 통신사는 자신의 요금제만 삭제 가능
      if (!req.user.isAdmin && req.user.agencyId !== plan.agencyId) {
         throw new ApiError(403, '삭제 권한이 없습니다.')
      }

      await plan.update({ availability: false })
      await plan.destroy() // 소프트 삭제

      res.status(204).send()
   } catch (error) {
      next(error)
   }
}

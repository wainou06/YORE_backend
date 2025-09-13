const { Plans, PlanImgs, Agency, AdditionalServices, UserServices } = require('../models')
const { validatePlanData } = require('../utils/validators')
const ApiError = require('../utils/apiError')
const { upload, getFileUrl, deleteFile, decodeFilename } = require('../utils/fileUpload')
const path = require('path')

exports.createPlan = async (req, res, next) => {
   try {
      let planData = req.body
      if (req.body.planData) {
         try {
            planData = JSON.parse(req.body.planData)
         } catch (e) {
            throw new ApiError(400, '요금제 데이터 파싱 오류')
         }
      }

      // 모델 구조에 맞는 필수 필드만 추출
      const { name, agencyId, voice, data, sms, type, age, basePrice, finalPrice, dis, status, description, benefits } = planData

      // 필수값 검증
      if (!name || !agencyId || !voice || !data || !sms || !type || !age || !basePrice || !finalPrice || !dis || !status) {
         throw new ApiError(400, '필수 필드 누락')
      }
      // 이미지 파일 필수: req.files가 없거나 1개도 없으면 에러
      if (!req.files || req.files.length === 0) {
         throw new ApiError(400, '최소 1개의 이미지 파일이 필요합니다.')
      }

      // 실제로 DB에 존재하는지 확인
      const agency = await Agency.findByPk(agencyId)
      if (!agency) {
         throw new ApiError(400, '유효하지 않은 통신사입니다.')
      }

      // Plans 생성
      const plan = await Plans.create({
         name,
         agencyId,
         voice,
         data,
         sms,
         type,
         age,
         basePrice,
         finalPrice,
         dis,
         status,
         description,
         benefits,
      })

      // PlanImgs(이미지) 생성: req.files 기반
      for (let i = 0; i < req.files.length; i++) {
         const file = req.files[i]
         await PlanImgs.create({
            originName: file.originalname,
            imgURL: `/uploads/${path.basename(file.path)}`,
            mainImg: i === 0 ? 'Y' : 'N', // 첫 번째 이미지를 대표로
            planId: plan.id,
         })
      }

      // (선택) 부가서비스 생성
      if (planData.services && Array.isArray(planData.services)) {
         for (const svc of planData.services) {
            if (svc.name && svc.provider && svc.fee) {
               await AdditionalServices.create({
                  name: svc.name,
                  provider: svc.provider,
                  planId: plan.id,
                  fee: svc.fee,
                  description: svc.description || null,
               })
            }
         }
      }

      res.status(201).json({ status: 'success', data: plan })
   } catch (error) {
      next(error)
   }
}

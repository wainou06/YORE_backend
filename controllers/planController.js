const { Plans, PlanImgs, Agency, AdditionalServices } = require('../models')
const ApiError = require('../utils/apiError')
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

exports.getPlans = async (req, res, next) => {
   console.log('[getPlans] called, user:', req.user ? (req.user.toJSON ? req.user.toJSON() : req.user) : null, 'admin:', req.admin ? (req.admin.toJSON ? req.admin.toJSON() : req.admin) : null)
   try {
      let plans
      const includeAgency = [{ model: Agency, as: 'agency', attributes: ['agencyName'] }]
      if (req.admin) {
         // 관리자: 전체
         plans = await Plans.findAll({ include: includeAgency })
      } else if (req.user?.access === 'agency') {
         // 통신사: 본인 소속만
         const agency = await Agency.findOne({ where: { userId: req.user.id } })
         if (!agency) {
            return res.status(403).json({ message: '소속 통신사 정보가 없습니다.' })
         }
         plans = await Plans.findAll({ where: { agencyId: agency.id }, include: includeAgency })
         console.log('[getPlans][agency] agency:', agency && agency.toJSON ? agency.toJSON() : agency)
         console.log('[getPlans][agency] plans:', Array.isArray(plans) ? plans.map((p) => (p.toJSON ? p.toJSON() : p)) : plans)
      } else {
         // 일반 사용자/비로그인: 공개(active)만
         plans = await Plans.findAll({ where: { status: 'active' }, include: includeAgency })
      }
      res.json(plans)
   } catch (err) {
      console.error('[getPlans][catch] error:', err)
      next(err)
   }
}

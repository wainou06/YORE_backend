const { Plans, PlanImgs, Agency, AdditionalServices, sequelize } = require('../models')
const ApiError = require('../utils/apiError')
const path = require('path')

exports.createPlan = async (req, res, next) => {
   const t = await sequelize.transaction()
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
      const plan = await Plans.create(
         {
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
         },
         { transaction: t }
      )

      // PlanImgs(이미지) 생성: req.files 기반
      for (let i = 0; i < req.files.length; i++) {
         const file = req.files[i]
         const uploadsRoot = path.join(__dirname, '..', 'uploads')
         let relativePath = path.relative(uploadsRoot, file.path).replace(/\\/g, '/')
         await PlanImgs.create(
            {
               originName: file.originalname,
               imgURL: `/uploads/${relativePath}`,
               mainImg: i === 0 ? 'Y' : 'N',
               planId: plan.id,
            },
            { transaction: t }
         )
      }

      // (선택) 부가서비스 생성
      if (planData.services && Array.isArray(planData.services)) {
         for (const svc of planData.services) {
            if (svc.name && svc.provider && svc.fee) {
               await AdditionalServices.create(
                  {
                     name: svc.name,
                     provider: svc.provider,
                     planId: plan.id,
                     fee: svc.fee,
                     description: svc.description || null,
                  },
                  { transaction: t }
               )
            }
         }
      }

      await t.commit()
      res.status(201).json({ status: 'success', data: plan })
   } catch (error) {
      await t.rollback()
      next(error)
   }
}

exports.getPlans = async (req, res, next) => {
   try {
      let plans
      const includeAgency = [
         { model: Agency, as: 'agency', attributes: ['agencyName'] },
         { model: PlanImgs, as: 'images', required: false, attributes: ['imgURL', 'mainImg'] },
         { model: AdditionalServices, as: 'additionalServices' },
      ]
      // 쿼리 파라미터로 agencyId가 오면 해당 통신사 요금제만 반환
      if (req.query.agencyId) {
         plans = await Plans.findAll({ where: { agencyId: req.query.agencyId }, include: includeAgency })
      } else if (req.admin) {
         // 관리자: 전체
         plans = await Plans.findAll({ include: includeAgency })
      } else if (req.user?.access === 'agency') {
         // 통신사: 본인 소속만
         const agency = await Agency.findOne({ where: { userId: req.user.id } })
         if (!agency) {
            return res.status(403).json({ message: '소속 통신사 정보가 없습니다.' })
         }
         plans = await Plans.findAll({ where: { agencyId: agency.id }, include: includeAgency })
      } else {
         // 일반 사용자/비로그인: 공개(active)만
         plans = await Plans.findAll({ where: { status: 'active' }, include: includeAgency })
      }
      // 각 plan에 대표 이미지(planImgUrl) 필드 추가
      const plansWithImg = plans.map((p) => {
         const obj = p.toJSON ? p.toJSON() : p
         if (obj.images && obj.images.length > 0) {
            // 대표 이미지(mainImg: 'Y')가 있으면 planImgUrl로 추가
            const main = obj.images.find((img) => img.mainImg === 'Y')
            if (main) obj.planImgUrl = main.imgURL
         }
         return obj
      })
      res.json(plansWithImg)
   } catch (err) {
      next(err)
   }
}

// 특정 요금제 상세 조회 (부가서비스 포함)
exports.getPlanById = async (req, res, next) => {
   try {
      const planId = req.params.id
      const plan = await Plans.findByPk(planId, {
         include: [
            { model: Agency, as: 'agency', attributes: ['id', 'agencyName'] },
            { model: AdditionalServices, as: 'additionalServices' },
            { model: PlanImgs, as: 'images', required: false, attributes: ['imgURL', 'mainImg'] },
         ],
      })
      if (!plan) return res.status(404).json({ message: '요금제를 찾을 수 없습니다.' })
      // 대표 이미지(mainImg: 'Y')가 있으면 planImgUrl 필드로 추가
      let planObj = plan.toJSON()
      if (planObj.images && planObj.images.length > 0) {
         const main = planObj.images.find((img) => img.mainImg === 'Y')
         if (main) planObj.planImgUrl = main.imgURL
      }
      res.json({ status: 'success', data: planObj })
   } catch (error) {
      next(error)
   }
}

// 요금제 수정 (관리자/통신사만, 부가서비스/이미지 포함)
exports.updatePlan = async (req, res, next) => {
   const t = await sequelize.transaction()
   try {
      const planId = req.params.id
      let planData = req.body
      if (typeof req.body.planData === 'string') {
         try {
            planData = JSON.parse(req.body.planData)
         } catch (e) {
            throw new ApiError(400, '요금제 데이터 파싱 오류')
         }
      } else if (typeof req.body.planData === 'object' && req.body.planData !== null) {
         planData = req.body.planData
      }

      // 권한 체크: 관리자 or (통신사 본인 소속)
      let plan = await Plans.findByPk(planId, { transaction: t })
      if (!plan) {
         await t.rollback()
         return res.status(404).json({ message: '요금제를 찾을 수 없습니다.' })
      }
      if (!req.admin) {
         const agency = await Agency.findOne({ where: { userId: req.user.id }, transaction: t })
         if (!agency || plan.agencyId !== agency.id) {
            await t.rollback()
            return res.status(403).json({ message: '수정 권한이 없습니다.' })
         }
      }

      // Plans 테이블에 해당하는 필드만 추출
      const allowedFields = ['name', 'agencyId', 'voice', 'data', 'sms', 'type', 'age', 'basePrice', 'finalPrice', 'dis', 'status', 'description', 'benefits']
      const updateObj = {}
      for (const key of allowedFields) {
         if (planData[key] !== undefined) updateObj[key] = planData[key]
      }
      await plan.update(updateObj, { transaction: t })

      // 이미지 수정 로직
      // 1. 새 파일이 있으면 기존 이미지 삭제 후 새로 생성
      if (req.files && req.files.length > 0) {
         await PlanImgs.destroy({ where: { planId }, transaction: t })
         const path = require('path')
         const uploadsRoot = path.join(__dirname, '..', 'uploads')
         for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i]
            let relativePath = path.relative(uploadsRoot, file.path).replace(/\\/g, '/')
            await PlanImgs.create(
               {
                  originName: file.originalname,
                  imgURL: `/uploads/${relativePath}`,
                  mainImg: i === 0 ? 'Y' : 'N',
                  planId: plan.id,
               },
               { transaction: t }
            )
         }
      } else if (req.body.existingImgUrls) {
         // 2. 기존 이미지만 있을 때 mainImg 정보만 업데이트
         let existingImgUrls = req.body.existingImgUrls
         if (typeof existingImgUrls === 'string') {
            try {
               existingImgUrls = JSON.parse(existingImgUrls)
            } catch (e) {
               existingImgUrls = []
            }
         }
         // 모든 기존 이미지 mainImg를 'N'으로 초기화 후, 대표이미지로 선택된 것만 'Y'로 변경
         await PlanImgs.update({ mainImg: 'N' }, { where: { planId }, transaction: t })
         for (const img of existingImgUrls) {
            if (img.isMain) {
               await PlanImgs.update({ mainImg: 'Y' }, { where: { planId, imgURL: img.imgURL }, transaction: t })
            }
         }
      }

      // 부가서비스 부분 수정 (update/insert/delete)
      if (Array.isArray(planData.services)) {
         // 1. 기존 DB의 부가서비스 id 목록 조회
         const existingServices = await AdditionalServices.findAll({ where: { planId }, transaction: t })
         const existingIds = existingServices.map((svc) => svc.id)

         // 2. 프론트에서 온 id 목록
         const incomingIds = planData.services.filter((svc) => svc.id).map((svc) => svc.id)

         // 3. 삭제 대상: 기존에는 있었으나 프론트에서 안 온 id
         const toDelete = existingIds.filter((id) => !incomingIds.includes(id))
         if (toDelete.length > 0) {
            await AdditionalServices.destroy({ where: { id: toDelete }, transaction: t })
         }

         // 4. update & create
         for (const svc of planData.services) {
            let provider = svc.provider
            if (!provider) {
               provider = planData.agencyName || (planData.agency && planData.agency.agencyName) || ''
            }
            if (svc.name && provider && svc.fee) {
               if (svc.id) {
                  // update
                  await AdditionalServices.update(
                     {
                        name: svc.name,
                        provider,
                        fee: svc.fee,
                        description: svc.description || null,
                     },
                     { where: { id: svc.id, planId }, transaction: t }
                  )
               } else {
                  // create
                  await AdditionalServices.create(
                     {
                        name: svc.name,
                        provider,
                        planId: plan.id,
                        fee: svc.fee,
                        description: svc.description || null,
                     },
                     { transaction: t }
                  )
               }
            }
         }
      }

      await t.commit()
      res.json({ status: 'success', data: plan })
   } catch (error) {
      await t.rollback()
      next(error)
   }
}

// 요금제 삭제 (관리자/통신사만, 부가서비스 포함)
exports.deletePlan = async (req, res, next) => {
   const t = await sequelize.transaction()
   try {
      const planId = req.params.id
      let plan = await Plans.findByPk(planId, { transaction: t })
      if (!plan) {
         await t.rollback()
         return res.status(404).json({ message: '요금제를 찾을 수 없습니다.' })
      }
      if (!req.admin) {
         // 통신사 본인 소속만
         const agency = await Agency.findOne({ where: { userId: req.user.id }, transaction: t })
         if (!agency || plan.agencyId !== agency.id) {
            await t.rollback()
            return res.status(403).json({ message: '삭제 권한이 없습니다.' })
         }
      }
      // 부가서비스 먼저 삭제
      await AdditionalServices.destroy({ where: { planId }, transaction: t })
      // 이미지도 함께 삭제
      await PlanImgs.destroy({ where: { planId }, transaction: t })
      // 요금제 삭제
      await plan.destroy({ transaction: t })
      await t.commit()
      res.json({ status: 'success' })
   } catch (error) {
      await t.rollback()
      next(error)
   }
}

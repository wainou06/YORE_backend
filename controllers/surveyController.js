const smartchoiceService = require('../services/smartchoiceService')
const { Surveys } = require('../models')
const logger = require('../utils/logger')

exports.submitSurvey = async (req, res, next) => {
   try {
      const { voice, data, sms, age, type, dis } = req.body

      // 스마트초이스 API 호출
      const recommendations = await smartchoiceService.getRecommendedPlans({
         voice,
         data,
         sms,
         age,
         type,
         dis,
      })

      // 설문 데이터와 API 응답 저장
      const survey = await Surveys.create({
         voice,
         data,
         sms,
         age,
         type,
         dis,
         userIp: req.ip,
         apiResponse: JSON.stringify(recommendations),
      })

      res.json({
         success: true,
         data: {
            surveyId: survey.id,
            recommendations,
         },
      })
   } catch (error) {
      logger.error('Survey submission error:', error)
      next(error)
   }
}

exports.getSurveyResults = async (req, res, next) => {
   try {
      const { id } = req.params

      const survey = await Surveys.findByPk(id)
      if (!survey) {
         return res.status(404).json({
            success: false,
            message: '설문 결과를 찾을 수 없습니다.',
         })
      }

      // 저장된 API 응답 사용
      const recommendations = survey.apiResponse ? JSON.parse(survey.apiResponse) : null

      // API 응답이 없는 경우 재호출
      if (!recommendations) {
         const newRecommendations = await smartchoiceService.getRecommendedPlans({
            voice: survey.voice,
            data: survey.data,
            sms: survey.sms,
            age: survey.age,
            type: survey.type,
            dis: survey.dis,
         })

         // API 응답 업데이트
         await survey.update({
            apiResponse: JSON.stringify(newRecommendations),
         })

         res.json({
            success: true,
            data: {
               survey,
               recommendations: newRecommendations,
            },
         })
      } else {
         res.json({
            success: true,
            data: {
               survey,
               recommendations,
            },
         })
      }
   } catch (error) {
      logger.error('Get survey results error:', error)
      next(error)
   }
}

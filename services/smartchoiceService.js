const axios = require('axios')
const convert = require('xml-js')
const logger = require('../utils/logger')

class SmartChoiceService {
   constructor() {
      this.baseURL = 'http://api.smartchoice.or.kr/openAPI.xml'
      this.authkey = process.env.SMARTCHOICE_AUTH_KEY
   }

   /**
    * 요금제 추천 API 호출
    * @param {Object} params
    * @param {string} params.voice - 월 평균 통화량 (분)
    * @param {string} params.data - 월 평균 데이터 사용량 (MB)
    * @param {string} params.sms - 월 평균 문자 발송량 (건)
    * @param {string} params.age - 연령(성인:20, 청소년:18, 실버:65)
    * @param {string} params.type - 서비스 타입(3G:2, LTE:3, 5G:6)
    * @param {string} params.dis - 약정기간 (무약정:0, 12개월:12, 24개월:24)
    */
   async getRecommendedPlans(params) {
      try {
         const response = await axios.get(this.baseURL, {
            params: {
               authkey: this.authkey,
               ...params,
            },
         })

         // XML을 JSON으로 변환
         const result = convert.xml2js(response.data, { compact: true, spaces: 4 })

         // 응답 코드 확인
         const resultCode = result.response.header.resultCode._text
         if (resultCode !== '100') {
            throw new Error(this.getErrorMessage(resultCode))
         }

         // 추천 요금제 목록 반환
         return {
            resultCode: resultCode,
            resultCount: parseInt(result.response.header.resultCount._text),
            resultDate: result.response.header.resultdate._text,
            plans: result.response.body.item.map((item) => ({
               telco: item.v_tel._text,
               price: parseInt(item.v_plan_price._text),
               discountPrice: parseInt(item.v_dis_price._text),
               overageInfo: item.v_plan_over._text,
               serviceName: item.v_add_name._text,
               planName: item.v_plan_name._text,
               voice: item.v_plan_display_voice._text,
               data: item.v_display_data._text,
               sms: item.v_plan_sms._text,
               recommendationType: parseInt(item.rn._text),
            })),
         }
      } catch (error) {
         logger.error('SmartChoice API Error:', error)
         throw new Error('요금제 추천 API 호출 중 오류가 발생했습니다.')
      }
   }

   getErrorMessage(code) {
      const errorMessages = {
         '001': '인증키가 유효하지 않습니다.',
         '002': 'API 호출 한도를 초과했습니다.',
         '099': '알 수 없는 오류가 발생했습니다.',
      }
      return errorMessages[code] || '알 수 없는 오류가 발생했습니다.'
   }
}

module.exports = new SmartChoiceService()

const rateLimit = require('express-rate-limit')

// 개발 환경 설정
const developmentLimiter = rateLimit({
   windowMs: 1 * 60 * 1000, // 1분
   max: 100, // IP당 100회
   message: {
      status: 'error',
      message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
   },
   standardHeaders: true,
   legacyHeaders: false,
})

// 배포 환경 설정
const productionLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15분
   max: 30, // IP당 30회
   message: {
      status: 'error',
      message: '너무 많은 요청이 발생했습니다. 15분 후 다시 시도해주세요.',
   },
   standardHeaders: true,
   legacyHeaders: false,
})

// 결제 API 전용 제한 설정
const paymentLimiter = (env) => {
   if (env === 'development') {
      return rateLimit({
         windowMs: 1 * 60 * 1000, // 1분
         max: 10, // IP당 10회
         message: {
            status: 'error',
            message: '결제 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
         },
      })
   }

   return rateLimit({
      windowMs: 15 * 60 * 1000, // 15분
      max: 5, // IP당 5회
      message: {
         status: 'error',
         message: '결제 요청이 너무 많습니다. 15분 후 다시 시도해주세요.',
      },
   })
}

// 구독 API 전용 제한 설정
const subscriptionLimiter = (env) => {
   if (env === 'development') {
      return rateLimit({
         windowMs: 1 * 60 * 1000, // 1분
         max: 20, // IP당 20회
         message: {
            status: 'error',
            message: '구독 관련 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
         },
      })
   }

   return rateLimit({
      windowMs: 15 * 60 * 1000, // 15분
      max: 10, // IP당 10회
      message: {
         status: 'error',
         message: '구독 관련 요청이 너무 많습니다. 15분 후 다시 시도해주세요.',
      },
   })
}

module.exports = {
   developmentLimiter,
   productionLimiter,
   paymentLimiter,
   subscriptionLimiter,
}

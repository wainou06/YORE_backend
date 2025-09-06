const { Op } = require('sequelize')
const ApiError = require('./apiError')

// 결제 처리 시뮬레이션
const processPayment = async (amount, paymentMethod) => {
   // 결제 성공 확률 90%
   const isSuccess = Math.random() < 0.9

   if (!isSuccess) {
      throw new Error('결제 처리 중 오류가 발생했습니다.')
   }

   return {
      success: true,
      transactionId: generateTransactionId(),
      message: '결제가 성공적으로 처리되었습니다.',
   }
}

// 최대 재시도 횟수
const MAX_RETRY_COUNT = 3
// 재시도 대기 시간 (밀리초)
const RETRY_DELAY = 1000

// 결제 재시도 로직
const retryPayment = async (amount, paymentMethod) => {
   let lastError

   for (let i = 0; i < MAX_RETRY_COUNT; i++) {
      try {
         const result = await processPayment(amount, paymentMethod)
         return result
      } catch (error) {
         lastError = error
         // 마지막 시도가 아니라면 대기 후 재시도
         if (i < MAX_RETRY_COUNT - 1) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (i + 1)))
         }
      }
   }

   throw new ApiError(400, `결제 처리 실패 (${MAX_RETRY_COUNT}회 시도): ${lastError.message}`)
}

// 트랜잭션 ID 생성
const generateTransactionId = () => {
   const prefix = 'TRX'
   const timestamp = Date.now()
   const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
   return `${prefix}${timestamp}${random}`
}

module.exports = {
   processPayment,
   retryPayment,
}

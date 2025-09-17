// utils/scheduler.js
const cron = require('node-cron')
const { User, Coupons, UserCoupon } = require('../models')
const logger = require('./logger')

async function runBirthdayCouponScheduler() {
   try {
      logger.info('생일쿠폰 자동 지급 스케줄러 시작')
      // 오늘 날짜 (월, 일)
      const today = new Date()
      const month = today.getMonth() + 1 // 1~12
      const day = today.getDate() // 1~31

      // 생일이 오늘인 유저 조회 (birth: YYYY-MM-DD)
      const users = await User.findAll({
         where: {
            birth: {
               [require('sequelize').Op.and]: [require('sequelize').where(require('sequelize').fn('MONTH', require('sequelize').col('birth')), month), require('sequelize').where(require('sequelize').fn('DAY', require('sequelize').col('birth')), day)],
            },
         },
      })

      if (!users.length) {
         logger.info('오늘 생일인 유저 없음')
         return
      }

      // 생일쿠폰 정보
      const birthdayCoupon = await Coupons.findOne({ where: { couponNm: '생일쿠폰' } })
      if (!birthdayCoupon) {
         logger.warn('생일쿠폰이 존재하지 않습니다.')
         return
      }

      for (const user of users) {
         // 이미 오늘 발급된 생일쿠폰이 있는지 확인
         const alreadyIssued = await UserCoupon.findOne({
            where: {
               userId: user.id,
               couponId: birthdayCoupon.id,
               issuedDate: {
                  [require('sequelize').Op.gte]: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
               },
            },
         })
         if (!alreadyIssued) {
            await UserCoupon.create({
               userId: user.id,
               couponId: birthdayCoupon.id,
               status: 'active',
               issuedDate: new Date(),
            })
            logger.info(`${user.name}(${user.id})님 생일쿠폰 지급 완료`)
         } else {
            logger.info(`${user.name}(${user.id})님은 이미 오늘 생일쿠폰 지급됨`)
         }
      }
   } catch (err) {
      logger.error('생일쿠폰 지급 스케줄러 오류:', err)
   }
}

// 매일 0시마다 자동 실행
cron.schedule('0 0 * * *', runBirthdayCouponScheduler)

module.exports = { runBirthdayCouponScheduler }

// 테스트용: 직접 실행
if (require.main === module) {
   runBirthdayCouponScheduler()
}

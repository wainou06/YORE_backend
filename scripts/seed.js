const { Coupons, Admin, sequelize, User, Agency } = require('../models')

async function seedData() {
   await sequelize.authenticate()
   // 쿠폰 시드
   const exist = await Coupons.findOne({ where: { couponNm: '웰컴쿠폰' } })
   if (!exist) {
      await Coupons.create({
         couponNm: '웰컴쿠폰',
         discount: 10,
         expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
         description: '신규회원 웰컴쿠폰',
         totalQuantity: -1,
         remainingQuantity: -1,
      })
      console.log('기본 쿠폰 데이터 생성 완료')
   } else {
      console.log('기본 쿠폰 데이터 이미 존재')
   }

   // 생일쿠폰 시드
   const birthdayExist = await Coupons.findOne({ where: { couponNm: '생일쿠폰' } })
   if (!birthdayExist) {
      await Coupons.create({
         couponNm: '생일쿠폰',
         discount: 20,
         expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 유효
         description: '생일 축하 쿠폰',
         totalQuantity: -1,
         remainingQuantity: -1,
      })
      console.log('생일쿠폰 데이터 생성 완료')
   } else {
      console.log('생일쿠폰 데이터 이미 존재')
   }

   // 어드민 시드
   const adminExist = await Admin.findOne({ where: { email: 'admin@yore.com' } })
   let adminId
   if (!adminExist) {
      const admin = await Admin.create({
         name: '관리자',
         email: 'admin@yore.com',
         password: 'admin',
      })
      adminId = admin.id
      console.log('기본 어드민(admin) 계정 생성 완료')
   } else {
      adminId = adminExist.id
      console.log('기본 어드민(admin) 계정 이미 존재')
   }

   // 기본 User 시드
   const userExist = await User.findOne({ where: { userid: 'yore' } })
   let userId
   if (!userExist) {
      const user = await User.create({
         userid: 'yore',
         password: 'yore1234',
         name: 'YORE',
         email: 'yore@yore.com',
         phone: '01012345678',
         access: 'agency',
         adminId: adminId,
      })
      userId = user.id
      console.log('기본 User(yore) 계정 생성 완료')
   } else {
      userId = userExist.id
      console.log('기본 User(yore) 계정 이미 존재')
   }

   // 기본 Agency 시드
   const agencyExist = await Agency.findOne({ where: { agencyName: 'YORE' } })
   if (!agencyExist) {
      await Agency.create({
         agencyName: 'YORE',
         businessNumber: '1234567890',
         managerName: 'YORE',
         userId: userId,
      })
      console.log('기본 Agency(YORE) 데이터 생성 완료')
   } else {
      console.log('기본 Agency(YORE) 데이터 이미 존재')
   }
}

if (require.main === module) {
   seedData()
}
module.exports = seedData

const jwt = require('jsonwebtoken')
const { User, Agency, Coupons, UserCoupon, Transactions, UserServices, sequelize } = require('../models')
const logger = require('../utils/logger')
const bcrypt = require('bcryptjs')

exports.register = async (req, res, next) => {
   try {
      const { email, password, name, userid, phone, access, agency } = req.body

      const existingUser = await User.findOne({ where: { email } })
      if (existingUser) {
         return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' })
      }

      const existingUserid = await User.findOne({ where: { userid } })
      if (existingUserid) {
         return res.status(400).json({ success: false, message: '이미 사용 중인 사용자 ID입니다.' })
      }

      if (access === 'agency' && agency) {
         const existingAgency = await Agency.findOne({
            where: { businessNumber: agency.businessNumber },
         })
         if (existingAgency) {
            return res.status(400).json({ success: false, message: '이미 등록된 사업자등록번호입니다.' })
         }
      }

      const sequelize = require('../models').sequelize
      const t = await sequelize.transaction()
      try {
         const newUser = await User.create(
            {
               email,
               password,
               name,
               userid,
               phone,
               access: access || 'user',
            },
            { transaction: t }
         )

         let newAgency = null
         if (access === 'agency' && agency) {
            newAgency = await Agency.create(
               {
                  ...agency,
                  userId: newUser.id,
               },
               { transaction: t }
            )
         }

         if (access !== 'agency') {
            const welcomeCoupon = await Coupons.findOne({ where: { couponNm: '웰컴쿠폰' }, transaction: t })
            if (welcomeCoupon) {
               await UserCoupon.create(
                  {
                     userId: newUser.id,
                     couponId: welcomeCoupon.id,
                     status: 'active',
                     issuedDate: new Date(),
                  },
                  { transaction: t }
               )
            }
         }

         await t.commit()

         const userObj = newUser.get({ plain: true })
         delete userObj.password
         let agencyObj = null
         if (newAgency) {
            agencyObj = newAgency.get({ plain: true })
         }

         res.status(201).json({
            success: true,
            message: '회원가입 성공',
            user: userObj,
            ...(agencyObj ? { agency: agencyObj } : {}),
         })
      } catch (error) {
         await t.rollback()
         logger.error(error.stack || error)
         next(error)
      }
   } catch (error) {
      logger.error(error.stack || error)
      next(error)
   }
}

const passport = require('passport')
exports.login = (req, res, next) => {
   passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) {
         logger.error(err.stack || err)
         return next(err)
      }
      if (!user) {
         return res.status(401).json({ success: false, message: info && info.message ? info.message : '로그인 실패' })
      }

      const { userType } = req.body
      if (userType) {
         if (userType === 'business' && user.access !== 'agency') {
            return res.status(401).json({ success: false, message: '잘못된 사용자 유형입니다.' })
         }
         if (userType === 'personal' && user.access !== 'user') {
            return res.status(401).json({ success: false, message: '잘못된 사용자 유형입니다.' })
         }
      }

      const token = jwt.sign({ id: user.id, access: user.access }, process.env.JWT_SECRET, { expiresIn: '1h' })
      res.json({
         success: true,
         message: '로그인 성공',
         token,
         user,
      })
   })(req, res, next)
}

const { createOrUpdateUser, generateJWT } = require('../utils/auth')
exports.kakaoCallback = async (req, res) => {
   const code = req.query.code
   if (!code) return res.status(400).send('인가 코드 없음')

   try {
      const tokenResponse = await fetch(`${process.env.KAKAO_OAUTH_URL}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.KAKAO_CLIENT_ID,
            redirect_uri: process.env.KAKAO_REDIRECT_URI,
            code,
         }),
      })

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      const userResponse = await fetch(`${process.env.KAKAO_API_URL}`, {
         method: 'GET',
         headers: { Authorization: `Bearer ${accessToken}` },
      })

      const kakaoUser = await userResponse.json()

      const tempEmail = kakaoUser.id + '@kakao.com'
      const name = kakaoUser.kakao_account.profile.nickname

      const user = await createOrUpdateUser({
         userid: `kakao_${kakaoUser.id}`,
         email: tempEmail,
         name,
      })

      const token = generateJWT(user)
      res.redirect(`${process.env.FRONTEND_URL}/auth/kakao/callback?token=${token}&name=${encodeURIComponent(name)}`)
   } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/kakao/fail`)
   }
}

exports.getProfile = async (req, res, next) => {
   try {
      const user = await User.findOne({
         where: { id: req.user.id },
         attributes: ['id', 'email', 'name', 'userid', 'phone', 'access', 'createdAt', 'updatedAt'],
         include:
            req.user.access === 'agency'
               ? [
                    {
                       model: Agency,
                       as: 'agency',
                       attributes: ['id', 'agencyName', 'businessNumber', 'managerName'],
                    },
                 ]
               : [],
      })

      if (!user) {
         return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      }

      const plainUser = user.get({ plain: true })
      delete plainUser.password
      res.json({ success: true, user: plainUser })
   } catch (error) {
      logger.error(error.stack || error)
      next(error)
   }
}

exports.logout = (req, res, next) => {
   try {
      res.json({ success: true, message: '로그아웃 되었습니다.' })
   } catch (error) {
      logger.error(error.stack || error)
      next(error)
   }
}

exports.updateProfile = async (req, res, next) => {
   try {
      const { name, phone } = req.body
      const user = await User.findByPk(req.user.id)

      if (!user) {
         return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      }

      await user.update({
         name: name || user.name,
         phone: phone || user.phone,
      })

      const plainUser = user.get({ plain: true })
      delete plainUser.password
      res.json({ success: true, message: '프로필이 수정되었습니다.', user: plainUser })
   } catch (error) {
      logger.error(error.stack || error)
      next(error)
   }
}

exports.updateAgencyProfile = async (req, res, next) => {
   try {
      if (req.user.access !== 'agency') {
         return res.status(403).json({ success: false, message: '기업 회원만 접근할 수 있습니다.' })
      }

      const { agencyName, businessNumber, managerName } = req.body
      const agency = await Agency.findOne({ where: { userId: req.user.id } })

      if (!agency) {
         return res.status(404).json({ success: false, message: '기업 정보를 찾을 수 없습니다.' })
      }

      await agency.update({
         agencyName: agencyName || agency.agencyName,
         businessNumber: businessNumber || agency.businessNumber,
         managerName: managerName || agency.managerName,
      })

      res.json({ success: true, message: '기업 정보가 수정되었습니다.', agency })
   } catch (error) {
      logger.error(error.stack || error)
      next(error)
   }
}

exports.changePassword = async (req, res, next) => {
   try {
      const { currentPassword, newPassword } = req.body
      const user = await User.findByPk(req.user.id)

      if (!user) {
         return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      }

      //
      const isMatch = await user.validatePassword(currentPassword)
      //

      if (!isMatch) {
         return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' })
      }

      // 새 비밀번호 유효성 검사 추가
      if (!newPassword || newPassword.length < 6) {
         return res.status(400).json({ success: false, message: '새 비밀번호는 최소 6자 이상이어야 합니다.' })
      }

      // 새 비밀번호로 업데이트
      user.password = newPassword
      await user.save()

      res.json({ success: true, message: '비밀번호가 변경되었습니다.' })
   } catch (error) {
      logger.error(error.stack || error)
      next(error)
   }
}

exports.changeEmail = async (req, res, next) => {
   try {
      const { email } = req.body

      if (!email) {
         return res.status(400).json({ success: false, message: '이메일이 필요합니다.' })
      }

      const exists = await User.findOne({ where: { email } })
      if (exists) {
         return res.status(400).json({ success: false, message: '이미 존재하는 이메일입니다.' })
      }

      const user = await User.findByPk(req.user.id)
      if (!user) {
         return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      }

      user.email = email
      await user.save()

      res.json({ success: true, message: '이메일 변경 완료', user: { id: user.id, email: user.email } })
   } catch (err) {
      logger.error(err.stack || err)
      next(err)
   }
}

exports.changeBirth = async (req, res, next) => {
   try {
      const { birth } = req.body
      if (!birth) {
         return res.status(400).json({ success: false, message: '생일이 필요합니다.' })
      }

      const user = await User.findByPk(req.user.id)
      if (!user) {
         return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      }

      user.birth = birth
      await user.save()

      res.json({
         success: true,
         message: '생일이 업데이트되었습니다.',
         user,
      })
   } catch (err) {
      logger.error(err.stack || err)
      next(err)
   }
}

exports.findPassword = async (req, res) => {
   try {
      const { method, value } = req.body
      let user
      if (method === 'email') {
         user = await User.findOne({ where: { email: value } })
      } else if (method === 'phone') {
         user = await User.findOne({ where: { phone: value } })
      }

      if (!user) {
         return res.json({ success: false, message: '해당 사용자가 존재하지 않습니다.' })
      }

      const tempPassword = Math.random().toString(36).slice(-8)
      user.password = tempPassword
      await user.save()

      return res.json({ success: true, tempPassword })
   } catch (err) {
      res.status(500).json({ success: false, message: '서버 오류 발생' })
   }
}

exports.deleteAccount = async (req, res) => {
   const userId = req.user.id

   try {
      await sequelize.transaction(async (t) => {
         await UserServices.destroy({
            where: { userId },
            transaction: t,
         })

         await Transactions.destroy({
            where: { userId },
            transaction: t,
         })

         await Agency.destroy({
            where: { userId },
            transaction: t,
         })

         await User.destroy({
            where: { id: userId },
            transaction: t,
         })
      })

      return res.status(200).json({ success: true, message: '회원 탈퇴가 완료되었습니다.' })
   } catch (error) {
      return res.status(500).json({ success: false, message: '회원 탈퇴 중 오류가 발생했습니다.' })
   }
}

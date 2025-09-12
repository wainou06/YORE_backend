const jwt = require('jsonwebtoken')
const { User, Agency } = require('../models')
const logger = require('../utils/logger')

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

      // 기업회원인 경우 사업자등록번호 중복 체크
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
         // User 생성
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
         // 기업회원인 경우 Agency 테이블에도 저장
         if (access === 'agency' && agency) {
            newAgency = await Agency.create(
               {
                  ...agency,
                  userId: newUser.id,
               },
               { transaction: t }
            )
         }

         await t.commit()

         // 비밀번호 제거 후 반환
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
   // passport-local 전략 사용
   passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) {
         logger.error(err.stack || err)
         return next(err)
      }
      if (!user) {
         // info.message는 localStrategy에서 전달됨
         return res.status(401).json({ success: false, message: info && info.message ? info.message : '로그인 실패' })
      }

      // userType 체크 (business/personal)
      const { userType } = req.body
      if (userType) {
         if (userType === 'business' && user.access !== 'agency') {
            return res.status(401).json({ success: false, message: '잘못된 사용자 유형입니다.' })
         }
         if (userType === 'personal' && user.access !== 'user') {
            return res.status(401).json({ success: false, message: '잘못된 사용자 유형입니다.' })
         }
      }

      // JWT 토큰 발급
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })
      res.json({
         success: true,
         message: '로그인 성공',
         token,
         user,
      })
   })(req, res, next)
}

exports.getProfile = async (req, res) => {
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
      // JWT를 사용하는 경우 클라이언트에서 토큰을 삭제하도록 안내
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

      const { agencyName, managerName } = req.body
      const agency = await Agency.findOne({ where: { userId: req.user.id } })

      if (!agency) {
         return res.status(404).json({ success: false, message: '기업 정보를 찾을 수 없습니다.' })
      }

      await agency.update({
         agencyName: agencyName || agency.agencyName,
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

      // 현재 비밀번호 확인
      const isMatch = await user.validatePassword(currentPassword)
      if (!isMatch) {
         return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' })
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

// 이메일 변경
exports.changeEmail = async (req, res, next) => {
   try {
      const { newEmail } = req.body

      const exists = await User.findOne({ where: { email: newEmail } })
      if (exists) return res.status(400).json({ success: false, message: '이미 존재하는 이메일입니다.' })

      const user = await User.findByPk(req.user.id)
      user.email = newEmail
      await user.save()

      res.json({ success: true, message: '이메일 변경 완료' })
   } catch (err) {
      logger.error(err.stack || err)
      next(err)
   }
}

// 생일 변경

exports.changeBirth = async (req, res, next) => {
   try {
      const { birth } = req.body
      const user = await User.findByPk(req.user.id)
      user.birth = birth
      await user.save()

      res.json({ success: true, message: '생일이 업데이트되었습니다.' })
   } catch (err) {
      logger.error(err.stack || err)
      next(err)
   }
}

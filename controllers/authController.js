const jwt = require('jsonwebtoken')
const { User, Agency } = require('../models')

exports.register = async (req, res) => {
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

      const newUser = await User.create({
         email,
         password,
         name,
         userid,
         phone,
         access: access || 'user',
      })

      // 기업회원인 경우 Agency 테이블에도 저장
      if (access === 'agency' && agency) {
         await Agency.create({
            ...agency,
            userId: newUser.id,
         })
      }

      res.status(201).json({ success: true, message: '회원가입 성공', user: newUser.get({ plain: true }) })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

exports.login = async (req, res) => {
   try {
      const { email, password, userType } = req.body
      // 비밀번호가 없거나 빈 문자열이면 로그인 실패
      if (!password || password.trim() === '') {
         return res.status(400).json({ message: '비밀번호를 입력하세요.' })
      }

      const user = await User.findOne({
         where: { email },
         include:
            userType === 'business'
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
         return res.json({ success: false, message: '존재하지 않는 사용자입니다.' })
      }

      const isMatch = await user.validatePassword(password)
      if (!isMatch) {
         return res.json({ success: false, message: '비밀번호가 틀렸습니다.' })
      }

      if (user.access !== (userType === 'personal' ? 'user' : 'agency')) {
         return res.json({ success: false, message: '잘못된 사용자 유형입니다.' })
      }

      // 기업회원인 경우 agency 정보가 없으면 에러
      if (userType === 'business' && !user.agency) {
         return res.json({ success: false, message: '기업 정보를 찾을 수 없습니다.' })
      }

      // === JWT 토큰 발급 ===
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })

      const plainUser = user.get({ plain: true })
      delete plainUser.password
      res.json({
         success: true,
         message: '로그인 성공',
         token,
         user: plainUser,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
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
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

exports.logout = (req, res) => {
   try {
      // JWT를 사용하는 경우 클라이언트에서 토큰을 삭제하도록 안내
      res.json({ success: true, message: '로그아웃 되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

exports.updateProfile = async (req, res) => {
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
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

exports.updateAgencyProfile = async (req, res) => {
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
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

exports.changePassword = async (req, res) => {
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
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

// 이메일 변경
exports.changeEmail = async (req, res) => {
   try {
      const { newEmail } = req.body

      const exists = await User.findOne({ where: { email: newEmail } })
      if (exists) return res.status(400).json({ success: false, message: '이미 존재하는 이메일입니다.' })

      const user = await User.findByPk(req.user.id)
      user.email = newEmail
      await user.save()

      res.json({ success: true, message: '이메일 변경 완료' })
   } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}

// 생일 변경
exports.changeBirth = async (req, res) => {
   try {
      const { birth } = req.body
      const user = await User.findByPk(req.user.id)
      user.birth = birth
      await user.save()

      res.json({ success: true, message: '생일이 업데이트되었습니다.' })
   } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, message: '서버 오류' })
   }
}
const { User, Agency, Plans, Surveys, AdditionalServices } = require('../models')
const { Admin } = require('../models')
const ApiError = require('../utils/apiError')
const jwt = require('jsonwebtoken')

//관리자 생성
exports.registerAdmin = async (req, res, next) => {
   try {
      const { email, password } = req.body
      if (!email || !password) {
         throw new ApiError(400, '이메일과 비밀번호는 필수입니다.')
      }

      const admin = await Admin.create({
         email,
         name: 'admin',
         password,
      })

      res.status(201).json({ success: true, message: '관리자 등록 성공', admin: admin })
   } catch (error) {
      next(error)
   }
}

//관리자 로그인
exports.loginAdmin = async (req, res, next) => {
   try {
      const { email, password } = req.body

      if (!email || !password) {
         throw new ApiError(400, '이메일과 비밀번호는 필수입니다.')
      }

      const admin = await Admin.findOne({ where: { email } })
      if (!admin) {
         throw new ApiError(404, '존재하지 않는 관리자입니다.')
      }
      const isMatch = await admin.validatePassword(password)
      if (!isMatch) {
         throw new ApiError(401, '비밀번호가 틀렸습니다.')
      }

      const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '1h' })

      const resAdmin = { id: admin.id, name: admin.name, email: admin.email }

      res.status(200).json({ success: true, message: '관리자 로그인 성공', token, admin: resAdmin })
   } catch (error) {
      next(error)
   }
}
// 사용자 목록 조회
exports.getAllUsers = async (req, res, next) => {
   try {
      const { page = 1, limit = 10, role, status } = req.query
      const offset = (page - 1) * limit
      const where = {}

      if (role) {
         where.role = role
      }

      if (status) {
         where.status = status
      }

      const { count, rows: users } = await User.findAndCountAll({
         where,
         attributes: { exclude: ['password'] },
         include: [
            {
               model: Agency,
               as: 'agency',
               attributes: ['name', 'code'],
            },
         ],
         offset,
         limit: parseInt(limit),
         order: [['createdAt', 'DESC']],
      })

      res.status(200).json({
         status: 'success',
         data: {
            users,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               totalItems: count,
               itemsPerPage: parseInt(limit),
            },
         },
      })
   } catch (error) {
      next(error)
   }
}

// 특정 사용자 상세 정보 조회
exports.getUser = async (req, res, next) => {
   try {
      const { id } = req.params

      const user = await User.findByPk(id, {
         attributes: { exclude: ['password'] },
         include: [
            {
               model: Agency,
               as: 'agency',
               attributes: ['name', 'code'],
            },
         ],
      })

      if (!user) {
         throw new ApiError(404, '사용자를 찾을 수 없습니다.')
      }

      res.status(200).json({
         status: 'success',
         data: user,
      })
   } catch (error) {
      next(error)
   }
}

// 사용자 상태 변경 (활성화/비활성화)
exports.updateUserStatus = async (req, res, next) => {
   try {
      const { id } = req.params
      const { status } = req.body

      if (!['active', 'inactive', 'suspended'].includes(status)) {
         throw new ApiError(400, '잘못된 상태값입니다.')
      }

      const user = await User.findByPk(id)
      if (!user) {
         throw new ApiError(404, '사용자를 찾을 수 없습니다.')
      }

      await user.update({ status })

      res.status(200).json({
         status: 'success',
         data: user,
      })
   } catch (error) {
      next(error)
   }
}

// 통계 정보 조회
exports.getStatistics = async (req, res, next) => {
   try {
      const totalUsers = await User.count()
      const totalAgencies = await Agency.count()
      const totalPlans = await Plans.count()
      const totalSurveys = await Surveys.count()
      const totalServices = await AdditionalServices.count()

      const usersByRole = await User.count({
         group: ['role'],
      })

      const usersByStatus = await User.count({
         group: ['status'],
      })

      const plansByStatus = await Plans.count({
         group: ['approvalStatus'],
      })

      res.status(200).json({
         status: 'success',
         data: {
            totals: {
               users: totalUsers,
               agencies: totalAgencies,
               plans: totalPlans,
               surveys: totalSurveys,
               services: totalServices,
            },
            distribution: {
               usersByRole,
               usersByStatus,
               plansByStatus,
            },
         },
      })
   } catch (error) {
      next(error)
   }
}

// 관리자 로그 내보내기
exports.exportLogs = async (req, res, next) => {
   try {
      const { startDate, endDate, type } = req.query

      // 로그 파일 읽기 및 필터링 로직 구현 필요
      const logs = [] // TODO: 로그 파일에서 데이터 읽어오기

      res.status(200).json({
         status: 'success',
         data: logs,
      })
   } catch (error) {
      next(error)
   }
}

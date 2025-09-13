const express = require('express')
const router = express.Router()
const serviceController = require('../controllers/serviceController')
const { isAuthenticated } = require('../middlewares/authMiddleware')

router.post('/', isAuthenticated, (req, res, next) => {
   if (req.user?.access === 'agency' || req.admin) {
      return serviceController.createService(req, res, next)
   }
   return res.status(403).json({ message: '권한이 없습니다.' })
})

module.exports = router

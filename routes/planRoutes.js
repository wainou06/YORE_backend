const express = require('express')
const router = express.Router()
const planController = require('../controllers/planController')
const { isAuthenticated } = require('../middlewares/authMiddleware')
const { upload } = require('../utils/fileUpload')

router.post(
   '/',
   isAuthenticated,
   (req, res, next) => {
      if (req.user?.access === 'agency' || req.admin) {
         return next()
      }
      return res.status(403).json({ message: '권한이 없습니다.' })
   },
   upload.array('images'),
   planController.createPlan
)

module.exports = router

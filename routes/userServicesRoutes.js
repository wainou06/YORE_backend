const express = require('express')
const router = express.Router()
const userServicesController = require('../controllers/userServicesController')

// [GET] /user-services?userId=123
router.get('/', userServicesController.getUserServicesByUserId)

module.exports = router

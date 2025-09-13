const express = require('express')
const router = express.Router()
const serviceController = require('../controllers/serviceController')
const { isAuthenticated, isAgency } = require('../middlewares/authMiddleware')

router.post('/', isAuthenticated, isAgency, serviceController.createService)

module.exports = router

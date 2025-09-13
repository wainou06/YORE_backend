const express = require('express')
const router = express.Router()
const planController = require('../controllers/planController')
const { isAuthenticated, isAgency } = require('../middlewares/authMiddleware')
const { upload } = require('../utils/fileUpload')

router.post('/', isAuthenticated, isAgency, upload.array('images'), planController.createPlan)

module.exports = router

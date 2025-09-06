const express = require('express')
const router = express.Router()
const serviceController = require('../controllers/serviceController')
const { isAuthenticated, isAgency } = require('../middlewares/authMiddleware')

// Public routes (공개 접근 가능)
router.get('/', serviceController.getAllServices)
router.get('/:id', serviceController.getService)

// Agency routes (통신사 전용)
router.post('/', isAuthenticated, isAgency, serviceController.createService)
router.put('/:id', isAuthenticated, isAgency, serviceController.updateService)
router.delete('/:id', isAuthenticated, isAgency, serviceController.deleteService)

module.exports = router

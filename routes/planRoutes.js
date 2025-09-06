const express = require('express')
const router = express.Router()
const planController = require('../controllers/planController')
const { isAuthenticated, isAdmin, isAgency } = require('../middlewares/authMiddleware')

// Public routes (공개 접근 가능)
router.get('/', planController.getAllPlans)
router.get('/:id', planController.getPlan)

// Agency routes (통신사 전용)
router.post('/', isAuthenticated, isAgency, planController.createPlan)
router.put('/:id', isAuthenticated, isAgency, planController.updatePlan)
router.delete('/:id', isAuthenticated, isAgency, planController.deletePlan)

// Admin routes (관리자 전용)
router.patch('/:id/approve', isAuthenticated, isAdmin, planController.approvePlan)

module.exports = router

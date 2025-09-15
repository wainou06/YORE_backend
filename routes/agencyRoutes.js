const express = require('express')
const router = express.Router()
const agencyController = require('../controllers/agencyController')

// GET /agencies/by-user/:userId
router.get('/by-user/:userId', agencyController.getAgencyByUserId)

// 전체 통신사 목록
router.get('/', agencyController.getAllAgencies)

module.exports = router

const express = require('express')
const router = express.Router()
const agencyController = require('../controllers/agencyController')

// GET /agencies/by-user/:userId
router.get('/by-user/:userId', agencyController.getAgencyByUserId)

module.exports = router

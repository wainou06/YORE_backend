const { Agency } = require('../models')

// GET /agencies/by-user/:userId
exports.getAgencyByUserId = async (req, res) => {
   const { userId } = req.params
   try {
      const agency = await Agency.findOne({ where: { userId } })
      if (!agency) return res.status(404).json({ message: 'Agency not found' })
      res.json(agency)
   } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message })
   }
}

// GET /agencies (전체 통신사 목록)
exports.getAllAgencies = async (req, res) => {
   try {
      const agencies = await Agency.findAll({ attributes: ['id', 'agencyName'] })
      res.json(agencies)
   } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message })
   }
}
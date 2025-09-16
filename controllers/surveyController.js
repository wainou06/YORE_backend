const { Surveys, Plans, PlanImgs } = require('../models')

// [GET] /surveys - 전체 설문 리스트 조회
exports.getSurveys = async (req, res, next) => {
   try {
      const surveys = await Surveys.findAll({
         order: [['createdAt', 'DESC']],
         include: [
            {
               model: Plans,
               as: 'plan',
               attributes: ['id', 'name', 'finalPrice', 'description'],
               include: [
                  {
                     model: PlanImgs,
                     as: 'images',
                     attributes: ['imgURL'],
                  },
               ],
            },
         ],
      })
      res.json({ status: 'success', data: surveys })
   } catch (error) {
      next(error)
   }
}

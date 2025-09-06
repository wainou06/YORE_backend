module.exports = (sequelize, DataTypes) => {
   const PlanImgs = sequelize.define(
      'PlanImgs',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         originName: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: '원본 이미지명',
         },
         imgURL: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: '이미지 경로',
         },
         mainImg: {
            type: DataTypes.ENUM('Y', 'N'),
            defaultValue: 'N',
            comment: '대표 이미지 여부',
         },
         planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'plans',
               key: 'id',
            },
         },
      },
      {
         timestamps: true,
         tableName: 'plan_imgs',
      }
   )

   PlanImgs.associate = (models) => {
      PlanImgs.belongsTo(models.Plans, {
         foreignKey: 'planId',
         as: 'plan',
      })
   }

   return PlanImgs
}

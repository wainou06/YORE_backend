module.exports = (sequelize, DataTypes) => {
   const Plans = sequelize.define(
      'Plans',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '요금제명',
         },
         basePrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '기본 요금',
         },
         discountAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: '할인 금액',
         },
         finalPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '최종 요금',
         },
         contractPeriod: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '약정 기간(월)',
         },
         data: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '데이터 제공량',
         },
         voice: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '통화 제공량',
         },
         agencyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'agencies',
               key: 'id',
            },
         },
         recommendedVoice: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '권장 통화량',
         },
         recommendedData: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '권장 데이터 사용량',
         },
         recommendedAge: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '권장 연령대',
         },
         networkType: {
            type: DataTypes.ENUM('3G', 'LTE', '5G'),
            allowNull: false,
            defaultValue: 'LTE',
            comment: '네트워크 타입',
         },
         basePrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '기본 요금',
         },
         discountAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: '할인 금액',
         },
         finalPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '최종 요금',
         },
         message: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '문자 제공량',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '요금제 상세 설명',
         },
         benefits: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '부가 혜택',
         },
      },
      {
         timestamps: true,
         tableName: 'plans',
      }
   )

   Plans.associate = (models) => {
      Plans.belongsTo(models.Agency, {
         foreignKey: 'agencyId',
         as: 'agency',
      })
      Plans.hasMany(models.PlanImgs, {
         foreignKey: 'planId',
         as: 'images',
      })
      Plans.hasMany(models.AdditionalServices, {
         foreignKey: 'planId',
         as: 'additionalServices',
      })
      Plans.hasMany(models.Surveys, {
         foreignKey: 'planId',
         as: 'surveys',
      })
      Plans.hasMany(models.UserPlan, {
         foreignKey: 'planId',
         as: 'userPlans',
      })
   }

   return Plans
}

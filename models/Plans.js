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
         agencyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'agencies',
               key: 'id',
            },
         },
         voice: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '통화 제공량 (분, 무제한:999999)',
            validate: {
               isValidVoice(value) {
                  if (value !== '999999' && isNaN(value)) {
                     throw new Error('통화량은 숫자나 무제한(999999)이어야 합니다')
                  }
               },
            },
         },
         data: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '데이터 제공량 (MB, 무제한:999999)',
            validate: {
               isValidData(value) {
                  if (value !== '999999' && isNaN(value)) {
                     throw new Error('데이터 사용량은 숫자나 무제한(999999)이어야 합니다')
                  }
               },
            },
         },
         sms: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '문자 제공량 (건, 무제한:999999)',
            validate: {
               isValidSms(value) {
                  if (value !== '999999' && isNaN(value)) {
                     throw new Error('문자 발송량은 숫자나 무제한(999999)이어야 합니다')
                  }
               },
            },
         },
         type: {
            type: DataTypes.ENUM('2', '3', '6'),
            allowNull: false,
            comment: '서비스 타입(3G:2, LTE:3, 5G:6)',
         },
         age: {
            type: DataTypes.ENUM('18', '20', '65'),
            allowNull: false,
            comment: '연령(성인:20, 청소년:18, 실버:65)',
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
         dis: {
            type: DataTypes.ENUM('0', '12', '24'),
            allowNull: false,
            defaultValue: '0',
            comment: '약정기간 (무약정:0, 12개월:12, 24개월:24)',
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
         status: {
            type: DataTypes.ENUM('active', 'inactive', 'pending'),
            allowNull: false,
            defaultValue: 'active',
            comment: '요금제 상태',
         },
      },
      {
         timestamps: true,
         tableName: 'plans',
         indexes: [
            {
               fields: ['agencyId'],
            },
            {
               fields: ['type', 'status'],
            },
         ],
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

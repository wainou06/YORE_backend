module.exports = (sequelize, DataTypes) => {
   const AdditionalServices = sequelize.define(
      'AdditionalServices',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '서비스 이름',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '서비스 설명',
         },
         provider: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '제공자',
         },
         planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'plans',
               key: 'id',
            },
         },
         fee: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '부가 서비스 요금',
         },
      },
      {
         timestamps: true,
         tableName: 'additional_services',
      }
   )

   AdditionalServices.associate = (models) => {
      AdditionalServices.belongsTo(models.Plans, {
         foreignKey: 'planId',
         as: 'plan',
      })

      AdditionalServices.hasMany(models.ServiceAnalytics, {
         foreignKey: 'serviceId',
         as: 'analytics',
      })

      AdditionalServices.hasMany(models.Notifications, {
         foreignKey: 'serviceId',
         as: 'notifications',
      })
      AdditionalServices.hasMany(models.UserServices, {
         foreignKey: 'serviceId',
         as: 'userServices',
      })
   }

   return AdditionalServices
}

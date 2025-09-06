module.exports = (sequelize, DataTypes) => {
   const ServiceAnalytics = sequelize.define(
      'ServiceAnalytics',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'AdditionalServices',
               key: 'id',
            },
         },
         agencyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'Agency',
               key: 'id',
            },
         },
         viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
         },
         purchaseCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
         },
         totalRevenue: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
         },
         period: {
            type: DataTypes.DATE,
            allowNull: false,
         },
      },
      {
         timestamps: true,
      },
      {
         timestamps: true,
         indexes: [
            {
               fields: ['serviceId', 'period'],
               unique: true,
            },
            {
               fields: ['agencyId'],
            },
            {
               fields: ['period'],
            },
         ],
      }
   )

   ServiceAnalytics.associate = (models) => {
      ServiceAnalytics.belongsTo(models.AdditionalServices, {
         foreignKey: 'serviceId',
         as: 'service',
      })

      ServiceAnalytics.belongsTo(models.Agency, {
         foreignKey: 'agencyId',
         as: 'agency',
      })
   }

   return ServiceAnalytics
}

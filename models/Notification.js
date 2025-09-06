module.exports = (sequelize, DataTypes) => {
   const Notification = sequelize.define(
      'Notification',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         title: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         message: {
            type: DataTypes.TEXT,
            allowNull: false,
         },
         type: {
            type: DataTypes.ENUM('SERVICE_UPDATE', 'PRICE_CHANGE', 'NEW_SERVICE', 'SYSTEM'),
            allowNull: false,
         },
         agencyId: {
            type: DataTypes.INTEGER,
            references: {
               model: 'Agency',
               key: 'id',
            },
         },
         serviceId: {
            type: DataTypes.INTEGER,
            references: {
               model: 'AdditionalServices',
               key: 'id',
            },
         },
         isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         },
         targetUserType: {
            type: DataTypes.ENUM('ALL', 'ADMIN', 'AGENCY', 'USER'),
            allowNull: false,
            defaultValue: 'ALL',
         },
      },
      {
         timestamps: true,
         indexes: [
            {
               fields: ['type'],
            },
            {
               fields: ['targetUserType'],
            },
            {
               fields: ['isRead'],
            },
            {
               fields: ['agencyId'],
            },
            {
               fields: ['serviceId'],
            },
            {
               fields: ['createdAt'],
            },
         ],
      }
   )

   Notification.associate = (models) => {
      Notification.belongsTo(models.Agency, {
         foreignKey: 'agencyId',
         as: 'agency',
      })

      Notification.belongsTo(models.AdditionalServices, {
         foreignKey: 'serviceId',
         as: 'service',
      })
   }

   return Notification
}

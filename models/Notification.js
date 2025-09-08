module.exports = (sequelize, DataTypes) => {
   const Notification = sequelize.define(
      'Notifications', // 테이블 이름을 복수형으로 변경
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
               model: 'agencies',
               key: 'id',
            },
         },
         serviceId: {
            type: DataTypes.INTEGER,
            references: {
               model: 'additional_services',
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

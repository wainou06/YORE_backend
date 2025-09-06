module.exports = (sequelize, DataTypes) => {
   const UserServices = sequelize.define(
      'UserServices',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'users',
               key: 'id',
            },
         },
         serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'additional_services',
               key: 'id',
            },
         },
         monthly_fee: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '월별 가격',
         },
         status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            comment: '사용 여부',
         },
         startDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         endDate: {
            type: DataTypes.DATE,
            allowNull: true,
         },
      },
      {
         timestamps: true,
         tableName: 'user_services',
      }
   )

   UserServices.associate = (models) => {
      UserServices.belongsTo(models.User, {
         foreignKey: 'userId',
         as: 'user',
      })
      UserServices.belongsTo(models.AdditionalServices, {
         foreignKey: 'serviceId',
         as: 'service',
      })
   }

   return UserServices
}

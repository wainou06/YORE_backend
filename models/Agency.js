module.exports = (sequelize, DataTypes) => {
   const Agency = sequelize.define(
      'Agency',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         agencyName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
         },
         businessNumber: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true,
            validate: {
               is: /^[0-9]{10}$/, // 10자리 숫자만 허용
            },
         },
         managerName: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
         userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
               model: 'users',
               key: 'id',
            },
         },
      },
      {
         timestamps: true,
         tableName: 'agencies',
      }
   )

   Agency.associate = (models) => {
      Agency.belongsTo(models.User, {
         foreignKey: 'userId',
         as: 'user',
      })
      Agency.hasMany(models.Plans, {
         foreignKey: 'agencyId',
         as: 'plans',
      })
      Agency.hasMany(models.ServiceAnalytics, {
         foreignKey: 'agencyId',
         as: 'analytics',
      })
      Agency.hasMany(models.Notifications, {
         foreignKey: 'agencyId',
         as: 'notifications',
      })
   }

   return Agency
}

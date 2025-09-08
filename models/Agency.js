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
         managerName: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
      },
      {
         timestamps: true,
         tableName: 'agencies',
      }
   )

   Agency.associate = (models) => {
      Agency.hasMany(models.User, {
         foreignKey: 'agencyId',
         as: 'users',
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

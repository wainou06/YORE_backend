module.exports = (sequelize, DataTypes) => {
   const UserPlan = sequelize.define(
      'UserPlan',
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
         planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'plans',
               key: 'id',
            },
         },
         total_fee: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '총 요금',
         },
         monthly_fee: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '월별 요금',
         },
         status: {
            type: DataTypes.ENUM('pending', 'active', 'expired', 'cancelled'),
            defaultValue: 'pending',
            allowNull: false,
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
         tableName: 'user_plans',
      }
   )

   UserPlan.associate = (models) => {
      UserPlan.belongsTo(models.User, {
         foreignKey: 'userId',
         as: 'user',
      })
      UserPlan.belongsTo(models.Plans, {
         foreignKey: 'planId',
         as: 'plan',
      })
      UserPlan.hasOne(models.Transactions, {
         foreignKey: 'userPlanId',
         as: 'transactions',
      })
   }

   return UserPlan
}

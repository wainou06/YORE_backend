module.exports = (sequelize, DataTypes) => {
   const Transactions = sequelize.define(
      'Transactions',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '결제 금액',
         },
         date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '결제일',
         },
         status: {
            type: DataTypes.ENUM('success', 'failed', 'pending'),
            defaultValue: 'pending',
            comment: '결제 상태',
         },
         paymentMethod: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '결제 방법',
         },
         userPlanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'user_plans',
               key: 'id',
            },
         },
         userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'users',
               key: 'id',
            },
         },
         transactionId: {
            type: DataTypes.STRING(100),
            unique: true,
            comment: '외부 결제 시스템 트랜잭션 ID',
         },
      },
      {
         timestamps: true,
         tableName: 'transactions',
      }
   )

   Transactions.associate = (models) => {
      Transactions.belongsTo(models.User, {
         foreignKey: 'userId',
         as: 'user',
      })
      Transactions.belongsTo(models.UserPlan, {
         foreignKey: 'userPlanId',
         as: 'userPlan',
      })
   }

   return Transactions
}

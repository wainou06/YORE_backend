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
            unique: true, // 1:1 관계 보장
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
         // 할부 관련 필드
         isInstallment: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '할부 여부',
         },
         installmentMonths: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '할부 개월 수',
         },
         installmentAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '할부 1회 결제 금액',
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

module.exports = (sequelize, DataTypes) => {
   const UserCoupon = sequelize.define(
      'UserCoupon',
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
         couponId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'coupons',
               key: 'id',
            },
         },
         status: {
            type: DataTypes.ENUM('active', 'used', 'expired'),
            defaultValue: 'active',
            comment: '쿠폰 상태',
         },
         usedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '사용 일자',
         },
         issuedDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '발급 일자',
         },
      },
      {
         timestamps: true,
         tableName: 'user_coupons',
      }
   )

   UserCoupon.associate = (models) => {
      UserCoupon.belongsTo(models.User, {
         foreignKey: 'userId',
         as: 'user',
      })
      UserCoupon.belongsTo(models.Coupons, {
         foreignKey: 'couponId',
         as: 'coupon',
      })
   }

   return UserCoupon
}

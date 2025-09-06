module.exports = (sequelize, DataTypes) => {
   const Coupons = sequelize.define(
      'Coupons',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         couponNm: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '쿠폰 이름',
         },
         discount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '할인율 (%)',
         },
         expirationDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '유효기간',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '쿠폰 설명',
         },
         minPurchaseAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '최소 구매 금액',
         },
         maxDiscountAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '최대 할인 금액',
         },
         totalQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: -1,
            comment: '총 발행 수량 (-1은 무제한)',
         },
         remainingQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: -1,
            comment: '남은 수량',
         },
      },
      {
         timestamps: true,
         tableName: 'coupons',
      }
   )

   Coupons.associate = (models) => {
      Coupons.hasMany(models.UserCoupon, {
         foreignKey: 'couponId',
         as: 'userCoupons',
      })
   }

   return Coupons
}

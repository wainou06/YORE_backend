module.exports = (sequelize, DataTypes) => {
   const Surveys = sequelize.define(
      'Surveys',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'plans',
               key: 'id',
            },
            comment: '선택한 요금제 ID',
         },
         voice: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '요금제의 통화량 (분, 무제한:999999)',
         },
         data: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '요금제의 데이터량 (MB, 무제한:999999)',
         },
         sms: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '요금제의 문자량 (건, 무제한:999999)',
         },
         age: {
            type: DataTypes.ENUM('18', '20', '65'),
            allowNull: false,
            comment: '연령(성인:20, 청소년:18, 실버:65)',
         },
         type: {
            type: DataTypes.ENUM('2', '3', '6'),
            allowNull: false,
            comment: '서비스 타입(3G:2, LTE:3, 5G:6)',
         },
         dis: {
            type: DataTypes.ENUM('0', '12', '24'),
            allowNull: false,
            comment: '약정기간 (무약정:0, 12개월:12, 24개월:24)',
         },
      },
      {
         timestamps: true,
         tableName: 'surveys',
         indexes: [
            {
               fields: ['planId'],
            },
         ],
      }
   )

   Surveys.associate = (models) => {
      Surveys.belongsTo(models.Plans, {
         foreignKey: 'planId',
         as: 'plan',
      })
   }

   return Surveys
}

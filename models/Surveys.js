module.exports = (sequelize, DataTypes) => {
   const Surveys = sequelize.define(
      'Surveys',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         voice: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '월 평균 통화량 (분)',
            validate: {
               isValidVoice(value) {
                  if (value !== '999999' && isNaN(value)) {
                     throw new Error('통화량은 숫자나 무제한(999999)이어야 합니다')
                  }
               },
            },
         },
         data: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '월 평균 데이터 사용량 (MB)',
            validate: {
               isValidData(value) {
                  if (value !== '999999' && isNaN(value)) {
                     throw new Error('데이터 사용량은 숫자나 무제한(999999)이어야 합니다')
                  }
               },
            },
         },
         sms: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '월 평균 문자 발송량 (건)',
            validate: {
               isValidSms(value) {
                  if (value !== '999999' && isNaN(value)) {
                     throw new Error('문자 발송량은 숫자나 무제한(999999)이어야 합니다')
                  }
               },
            },
         },
         age: {
            type: DataTypes.STRING(2),
            allowNull: false,
            comment: '연령(성인:20, 청소년:18, 실버:65)',
            validate: {
               isIn: [['18', '20', '65']],
            },
         },
         type: {
            type: DataTypes.STRING(1),
            allowNull: false,
            comment: '서비스 타입(3G:2, LTE:3, 5G:6)',
            validate: {
               isIn: [['2', '3', '6']],
            },
         },
         dis: {
            type: DataTypes.STRING(2),
            allowNull: false,
            comment: '약정기간 (무약정:0, 12개월:12, 24개월:24)',
            validate: {
               isIn: [['0', '12', '24']],
            },
         },
         selectedServices: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '선택된 부가 서비스 목록',
         },
         totalPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '할인 적용된 최종 금액',
         },
         points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '적립 예정 포인트',
         },
         planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'plans',
               key: 'id',
            },
            comment: '선택된 요금제 ID',
         },
         apiResponse: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'SmartChoice API 응답 데이터',
         },
         submittedDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '설문 제출일',
         },
         userIp: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '사용자 IP',
         },
      },
      {
         timestamps: true,
         tableName: 'surveys',
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

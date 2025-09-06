const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
   const User = sequelize.define(
      'User',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         userid: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
         },
         password: {
            type: DataTypes.STRING,
            allowNull: true, // 카카오 로그인의 경우 비밀번호가 없을 수 있음
         },
         name: {
            type: DataTypes.STRING(50),
            allowNull: false,
         },
         access: {
            type: DataTypes.ENUM('user', 'agency'),
            defaultValue: 'user',
         },
         agencyId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'agencies',
               key: 'id',
            },
         },
         email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
               isEmail: true,
            },
         },
         kakaoId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
         },
         phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
               is: /^[0-9]{10,11}$/,
            },
         },
         point: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
         },
         birth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
         },
      },
      {
         timestamps: true,
         tableName: 'users',
         hooks: {
            beforeCreate: async (user) => {
               if (user.password) {
                  const salt = await bcrypt.genSalt(10)
                  user.password = await bcrypt.hash(user.password, salt)
               }
            },
            beforeUpdate: async (user) => {
               if (user.changed('password')) {
                  const salt = await bcrypt.genSalt(10)
                  user.password = await bcrypt.hash(user.password, salt)
               }
            },
         },
      }
   )

   User.associate = (models) => {
      User.belongsTo(models.Agency, {
         foreignKey: 'agencyId',
         as: 'agency',
      })
      User.hasMany(models.UserPlan, {
         foreignKey: 'userId',
         as: 'userPlans',
      })
      User.hasMany(models.Transactions, {
         foreignKey: 'userId',
         as: 'transactions',
      })
      User.hasMany(models.UserCoupon, {
         foreignKey: 'userId',
         as: 'coupons',
      })
   }

   User.prototype.validatePassword = async function (password) {
      return await bcrypt.compare(password, this.password)
   }

   return User
}

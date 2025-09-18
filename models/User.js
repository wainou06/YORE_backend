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
            allowNull: true,
         },
         name: {
            type: DataTypes.STRING(50),
            allowNull: false,
         },
         access: {
            type: DataTypes.ENUM('user', 'agency'),
            defaultValue: 'user',
         },
         email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
               isEmail: true,
            },
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
         adminId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'admins',
               key: 'id',
            },
            comment: '관리자 ID(FK)',
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
                  if (user.password.length < 60) {
                     const salt = await bcrypt.genSalt(10)
                     user.password = await bcrypt.hash(user.password, salt)
                  }
               }
            },
         },
      }
   )

   User.associate = (models) => {
      User.belongsTo(models.Admin, {
         foreignKey: 'adminId',
         as: 'admin',
      })
      User.hasOne(models.Agency, {
         foreignKey: 'userId',
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
      User.hasMany(models.Notifications, {
         foreignKey: 'userId',
         as: 'notifications',
      })
   }

   User.prototype.validatePassword = async function (password) {
      return await bcrypt.compare(password, this.password)
   }

   return User
}

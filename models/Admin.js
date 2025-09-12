const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
   const Admin = sequelize.define(
      'Admin',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         name: {
            type: DataTypes.STRING(50),
            allowNull: false,
         },
         email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
               isEmail: true,
            },
         },
         password: {
            type: DataTypes.STRING,
            allowNull: false,
         },
      },
      {
         timestamps: true,
         tableName: 'admins',
         hooks: {
            beforeCreate: async (admin) => {
               if (admin.password) {
                  const salt = await bcrypt.genSalt(10)
                  admin.password = await bcrypt.hash(admin.password, salt)
               }
            },
            beforeUpdate: async (admin) => {
               if (admin.changed('password')) {
                  const salt = await bcrypt.genSalt(10)
                  admin.password = await bcrypt.hash(admin.password, salt)
               }
            },
         },
      }
   )

   Admin.associate = (models) => {
      Admin.hasMany(models.User, {
         foreignKey: 'adminId',
         as: 'users',
      })
   }

   Admin.prototype.validatePassword = async function (password) {
      return await bcrypt.compare(password, this.password)
   }

   return Admin
}

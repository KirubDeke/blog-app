module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "user",
    {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        isEmail: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          isIn: [[0, 1]]
        }
      }
    },
    { timestamps: true }
  );
  return User;
};

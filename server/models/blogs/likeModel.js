module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define("like", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    blogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return Like;
};

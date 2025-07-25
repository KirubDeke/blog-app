module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define("comment", {
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    blogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return Comment;
};

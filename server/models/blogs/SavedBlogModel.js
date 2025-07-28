module.exports = (sequelize, DataTypes) => {
    const SavedBlog = sequelize.define("saved_blog", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        blogId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
    return SavedBlog;
}
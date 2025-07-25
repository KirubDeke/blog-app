const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  `postgres://postgres:4321@localhost:5432/blogdb`,
  { dialect: "postgres" }
);

sequelize
  .authenticate()
  .then(() => {
    console.log(`Database connected to discover`);
  })
  .catch((err) => {
    console.log(err);
  });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//connecting to model
db.users = require("./users/userModel")(sequelize, DataTypes);
db.blogs = require("./blogs/blogModel")(sequelize, DataTypes);
db.likes = require("./blogs/likeModel")(sequelize, DataTypes);
db.comments = require("./blogs/commentModel")(sequelize, DataTypes);
//associations
db.users.hasMany(db.blogs, {
  foreignKey: "authorId",
  as: "blogs",
  onDelete: "CASCADE",
});

db.blogs.belongsTo(db.users, {
  foreignKey: "authorId",
  as: "author",
});
// Like associations
db.users.hasMany(db.likes, { foreignKey: "userId", onDelete: "CASCADE" });
db.blogs.hasMany(db.likes, { foreignKey: "blogId",  as: "likes", onDelete: "CASCADE" });
db.likes.belongsTo(db.users, { foreignKey: "userId" });
db.likes.belongsTo(db.blogs, { foreignKey: "blogId" });

// Comment associations
db.users.hasMany(db.comments, { foreignKey: "userId", onDelete: "CASCADE" });
db.blogs.hasMany(db.comments, { foreignKey: "blogId",  as: "comments", onDelete: "CASCADE" });
db.comments.belongsTo(db.users, { foreignKey: "userId" });
db.comments.belongsTo(db.blogs, { foreignKey: "blogId" });

//exporting the module
module.exports = db;

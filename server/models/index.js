require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

let sequelize;

if (process.env.NODE_ENV === "development") {
  // Local development (exact format you requested)
  sequelize = new Sequelize(process.env.DB_URL_DEVELOPMENT, {
    dialect: "postgres",
    logging: console.log, 
  });
} else {
  // Production (Neon)
  sequelize = new Sequelize(process.env.DB_URL_PRODUCTION, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false, // Disable logging in production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

sequelize
  .authenticate()
  .then(() => {
    const dbType =
      process.env.NODE_ENV === "development"
        ? "localhost PostgreSQL"
        : "Neon PostgreSQL";
    console.log(`Connected to ${dbType} successfully!`);
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });

// ===== Model Definitions =====
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models (your existing structure)
db.users = require("./users/userModel")(sequelize, DataTypes);
db.blogs = require("./blogs/blogModel")(sequelize, DataTypes);
db.likes = require("./blogs/likeModel")(sequelize, DataTypes);
db.comments = require("./blogs/commentModel")(sequelize, DataTypes);
db.saved_blog = require("./blogs/SavedBlogModel")(sequelize, DataTypes);

// ===== Relationships =====
// User-Blogs
db.users.hasMany(db.blogs, {
  foreignKey: "authorId",
  as: "blogs",
  onDelete: "CASCADE",
});
db.blogs.belongsTo(db.users, { foreignKey: "authorId", as: "author" });

// Likes
db.users.hasMany(db.likes, { foreignKey: "userId", onDelete: "CASCADE" });
db.blogs.hasMany(db.likes, {
  foreignKey: "blogId",
  as: "likes",
  onDelete: "CASCADE",
});
db.likes.belongsTo(db.users, { foreignKey: "userId" });
db.likes.belongsTo(db.blogs, { foreignKey: "blogId" });

// Comments
db.users.hasMany(db.comments, { foreignKey: "userId", onDelete: "CASCADE" });
db.blogs.hasMany(db.comments, {
  foreignKey: "blogId",
  as: "comments",
  onDelete: "CASCADE",
});
db.comments.belongsTo(db.users, { foreignKey: "userId" });
db.comments.belongsTo(db.blogs, { foreignKey: "blogId" });

// Saved Blogs
db.users.belongsToMany(db.blogs, {
  through: db.saved_blog,
  as: "savedBlogs",
  foreignKey: "userId",
});
db.blogs.belongsToMany(db.users, {
  through: db.saved_blog,
  as: "usersWhoSaved",
  foreignKey: "blogId",
});

// ===== Database Sync =====
const initializeDB = async () => {
  try {
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("Development database synced with model changes");
    } else {
      console.log("Production database connected (no auto-sync)");
      // In production, use migrations instead:
      // npx sequelize-cli db:migrate
    }
  } catch (err) {
    console.error("Initialization error:", err);
  }
};

initializeDB();

module.exports = db;

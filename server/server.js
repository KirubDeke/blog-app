const express = require("express");
const sequelize = require("sequelize");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const db = require("./models");
const path = require("path");
const userRoutes = require("./routes/users/userRoutes");
const blogRoutes = require("./routes/blogs/blogRoutes");
const contactRoutes = require("./routes/contact/contactRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");

//setting up your port
const PORT = process.env.PORT || 8000;

//assigning the variable app to express
const app = express();

//middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//synchronizing the database and forcing it to false so we dont lose data
db.sequelize.sync().then(() => {
  console.log("db has been re sync");
});

//routes for the user API
app.use("/curious-life/admin", adminRoutes);
app.use("/curious-life", userRoutes, contactRoutes);
app.use("/curious-life/blogs", blogRoutes);



//listening to server connection
app.listen(PORT, () => console.log(`Server is connected on ${PORT}`));

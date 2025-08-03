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

// Setting up your port
const PORT = process.env.PORT || 8000;

const app = express();

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://curious-life.vercel.app'
];

// Middleware for CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  console.log("Incoming request origin:", req.headers.origin);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Synchronizing the database
db.sequelize.sync().then(() => {
  console.log("DB has been re-synced");
});

// Routes
app.use("/curious-life/admin", adminRoutes);
app.use("/curious-life", userRoutes, contactRoutes);
app.use("/curious-life/blogs", blogRoutes);

app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});

// Starting the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

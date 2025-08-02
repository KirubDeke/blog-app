const jwt = require("jsonwebtoken");
const db = require("../models");

const authenticate = (req, res, next) => {
  const token = req.cookies?.jwt; 

  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "Unauthorized. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY); 
    req.user = decoded; 
    next(); 
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

const isAdmin = async (req, res, next) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({
      status: "fail",
      message: "User not authenticated.",
    });
  }

  try {
    const user = await db.users.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found.",
      });
    }
    
    if (user.role === 0) {
      return next();
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized. Admin access required.",
      });
    }

  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};

const canPost = async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "fail",
      message: "User not authenticated.",
    });
  }

  try {
    const user = await db.users.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found.",
      });
    }

    if (user.canPostBlog) {
      return next(); 
    } else {
      return res.status(403).json({
        status: "fail",
        message: "You are not allowed to post blogs.",
      });
    }
  } catch (error) {
    console.error("CanPost middleware error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
};


module.exports = {
  authenticate,
  isAdmin,
  canPost
};

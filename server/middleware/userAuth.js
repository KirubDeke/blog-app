const jwt = require("jsonwebtoken");

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

module.exports = authenticate;

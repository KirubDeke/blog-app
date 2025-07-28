const bcrypt = require("bcrypt");
const db = require("../../models");
const jwt = require("jsonwebtoken");
const { where, Model } = require("sequelize");

// Assigning users to the variable User
const User = db.users;

const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === "production", // only HTTPS in prod
      sameSite: "lax",
    });

    return res.status(201).json({
      status: "success",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

//login authentication

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const getMe = async (req, res) => {
  const token = req.cookies?.jwt;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    res.status(200).json({ user: decoded });
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const signout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    status: "success",
    message: "Successfully signed out",
  });
};
const profile = async (req, res) => {
  const userId = req.user?.id;
  try {
    const user = await db.users.findOne({
      where: { id: userId },
      attributes: ["id", "fullName", "email", "photo", "bio"],
    });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Profile fetched succcessfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

const editProfile = async (req, res) => {
  const userId = req.user?.id;
  const { fullName, email, password } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    console.log("BODY:", req.body);

    const user = await db.users.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const updateData = {
      fullName,
      email,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (photo) {
      updateData.photo = photo;
    }

    await db.users.update(updateData, { where: { id: userId } });

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "New password and confirmation do not match",
      });
    }

    const user = await db.users.findOne({
      where: { id: userId },
      attributes: ["password"],
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const checkPassword = await bcrypt.compare(currentPassword, user.password);
    if (!checkPassword) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect current password",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.users.update(
      { password: hashedNewPassword },
      { where: { id: userId } }
    );

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};
//fetch autor profile
const authorProfile = async (req, res) => {
  const authorId = parseInt(req.params.userId || req.user?.id, 10);

  if (isNaN(authorId)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid user ID",
    });
  }

  try {
    // Find author by primary key
    const author = await db.users.findByPk(authorId, {
      attributes: ["id", "fullName", "photo", "bio"],
      raw: true,
    });

    if (!author) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Get blogs authored by this user
    const blogs = await db.blogs.findAll({
      where: { authorId },
      attributes: ["id"],
      raw: true,
    });

    const blogIds = blogs.map((blog) => blog.id);
    const blogCount = blogIds.length;

    let totalLikes = 0;
    if (blogCount > 0) {
      totalLikes = await db.likes.count({
        where: {
          blogId: {
            [db.Sequelize.Op.in]: blogIds,
          },
        },
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        id: author.id,
        fullName: author.fullName,
        photo: author.photo,
        bio: author.bio,
        stats: {
          blogCount,
          totalLikes,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching author profile:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

const authorBio = async (req, res) => {
  const userId = req.user?.id;
  const { bio } = req.body;

  try {
    const user = await db.users.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }
    await user.update({ bio });

    return res.status(200).json({
      status: "success",
      message: "Bio updated successfully",
      data: { bio: user.bio },
    });
  } catch (error) {
    console.error("Error updating bio:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  signout,
  profile,
  editProfile,
  changePassword,
  authorProfile,
  authorBio,
};

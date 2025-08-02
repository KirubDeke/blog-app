const db = require("../../models");

const dashboardStats = async (req, res) => {
  try {
    const [users, blogs, likes, comments, saved] = await Promise.all([
      db.users.count(),
      db.blogs.count(),
      db.likes.count(),
      db.comments.count(),
      db.saved_blog.count(),
    ]);
    return res.status(200).json({
      status: "success",
      message: "Stats fetched successfully",
      data: {
        users,
        blogs,
        likes,
        comments,
        saved,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const fetchAllUsers = async (req, res) => {
  try {
    const users = await db.users.findAndCountAll({
      attributes: ["id", "fullName", "email", "canPostBlog"],
    });

    if (users.count === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No registered users on the platform",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      data: users.rows,
      totalCount: users.count,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const forbidAuthor = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await db.users.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    if (!user.canPostBlog) {
      return res.status(200).json({
        status: "fail",
        message:
          "User is already forbidden from posting, commenting, and liking.",
      });
    }

    user.canPostBlog = false;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "User has been forbidden from posting, commenting, and liking.",
      data: { canPostBlog: user.canPostBlog },
    });
  } catch (error) {
    console.error("Error in forbidAuthor:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const allowToPost = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await db.users.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }
    if (user.canPostBlog) {
      return res.status(200).json({
        status: "fail",
        message: "User already can post, like and comment",
      });
    }
    user.canPostBlog = true;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "User can now post, like and comment",
      data: { canPostBlog: user.canPostBlog },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
//remove user
const removeUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await db.users.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    await user.destroy();

    return res.status(200).json({
      status: "success",
      message: "User removed successfully",
    });
  } catch (error) {
    console.error("Error removing user:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const authorActivity = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await db.users.findByPk(userId, {
      attributes: [
        "id",
        "fullName",
        "email",
        "photo",
        "bio",
        "role",
        "canPostBlog",
      ],
      include: [
        {
          model: db.blogs,
          as: "blogs",
          attributes: ["id", "title", "body", "category", "image"],
          include: [
            {
              model: db.comments,
              as: "comments",
              attributes: ["id", "content", "createdAt"],
            },
            {
              model: db.likes,
              as: "likes",
              attributes: ["id"],
            },
          ],
        },
        {
          model: db.blogs,
          as: "savedBlogs", // adjust to match your alias
          through: { attributes: [] }, // omit join table data
          attributes: ["id", "title", "category", "image"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Calculate counts
    const totalBlogs = user.blogs.length;
    const totalLikes = user.blogs.reduce(
      (sum, blog) => sum + blog.likes.length,
      0
    );
    const totalComments = user.blogs.reduce(
      (sum, blog) => sum + blog.comments.length,
      0
    );
    const totalSavedBlogs = user.savedBlogs?.length || 0;

    return res.status(200).json({
      status: "success",
      message: "Successfully fetched user activity",
      data: {
        basicInfo: {
          fullName: user.fullName,
          email: user.email,
          photo: user.photo,
          bio: user.bio,
          role: user.role,
          canPostBlog: user.canPostBlog,
        },
        totalBlogs,
        totalLikes,
        totalComments,
        blogs: user.blogs.map((blog) => ({
          id: blog.id,
          title: blog.title,
          body: blog.body,
          category: blog.category,
          image: blog.image,
          comments: blog.comments,
          likesCount: blog.likes.length,
        })),
        totalSavedBlogs,
        savedBlogs: user.savedBlogs,
      },
    });
  } catch (error) {
    console.error("Error fetching author activity:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const fetchAllBlogs = async (req, res) => {
  try {
    const blogs = await db.blogs.findAndCountAll({
      attributes: ["id", "title", "body", "category", "image", "createdAt"],
      include: [
        {
          model: db.users,
          as: "author",
          attributes: ["id", "fullName", "email", "photo"]
        },
        {
          model: db.likes,
          as: "likes",
          attributes: ["id", "userId"],
          include: [
            {
              model: db.users,
              attributes: ["id", "fullName", "photo"]
            }
          ]
        },
        {
          model: db.comments,
          as: "comments",
          attributes: ["id", "content", "createdAt"],
          include: [
            {
              model: db.users,
              attributes: ["id", "fullName", "photo"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: blogs
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};


const deleteBlog = async (req, res) => {
  const { blogId } = req.params;

  try {
    const blog = await db.blogs.findByPk(blogId);
    if (!blog) {
      return res.status(404).json({
        status: "fail",
        message: "Blog not found"
      });
    }

    await blog.destroy();

    return res.status(200).json({
      status: "success",
      message: "Blog deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};


module.exports = {
  dashboardStats,
  fetchAllUsers,
  forbidAuthor,
  allowToPost,
  removeUser,
  authorActivity,
  fetchAllBlogs,
  deleteBlog
};

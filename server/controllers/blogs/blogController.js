const db = require("../../models");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const { where } = require("sequelize");

dayjs.extend(relativeTime);

const createBlog = async (req, res) => {
  const { title, body, category } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !body || !category) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required fields",
    });
  }

  try {
    const newBlog = await db.blogs.create({
      title,
      body,
      category,
      image,
      authorId: req.user.id,
    });

    return res.status(201).json({
      status: "success",
      message: "Blog created successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error in createBlog:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
      error: error.message,
    });
  }
};

//update a blog
const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, body, category } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const blog = await db.blogs.findOne({ where: { id } });

    if (!blog) {
      return res.status(404).json({
        status: "fail",
        message: "Blog Not Found",
      });
    }

    const updateData = { title, body, category, image };
    await db.blogs.update(updateData, { where: { id } });

    return res.status(200).json({
      status: "success",
      message: "Blog Updated Successfully",
    });
  } catch (error) {
    console.error("Update Blog Error:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await db.blogs.findOne({ where: { id } });

    if (!blog) {
      return res.status(404).json({
        status: "fail",
        message: "Blog Not Found",
      });
    }

    await db.blogs.destroy({ where: { id } });

    return res.status(200).json({
      status: "success",
      message: "Blog Deleted Successfully",
    });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

const commentBlog = async (req, res) => {
  const userId = req.user.id;
  const { blogId } = req.params;
  const { content } = req.body;

  const comment = await db.comments.create({ userId, blogId, content });

  return res.status(201).json({
    message: "Comment added",
    comment,
  });
};
//fetch a blogs comment

const blogComments = async (req, res) => {
  const { blogId } = req.params;

  try {
    const comments = await db.comments.findAll({
      where: { blogId },
      include: [
        {
          model: db.users,
          attributes: ["id", "fullName", "photo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const commentCount = comments.length;

    if (!comments || comments.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No comments found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Comments fetched successfully",
      commentCount,
      comments,
    });
  } catch (error) {
    console.error("Error fetching blog comments:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

const getBlogWithLikeCount = async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await db.blogs.findByPk(id, {
      include: [
        {
          model: db.likes,
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [db.Sequelize.fn("COUNT", db.Sequelize.col("likes.id")), "likeCount"],
        ],
      },
      group: ["blog.id"],
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//fetch all blogs
const allBlog = async (req, res) => {
  try {
    const blogs = await db.blogs.findAll({
      include: [
        {
          model: db.users,
          as: "author",
          attributes: ["fullName", "photo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (blogs.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No blogs found",
      });
    }

    const transformed = blogs.map((blog) => {
      const wordCount = blog.body?.split(/\s+/).length || 0;
      const readingTime = Math.ceil(wordCount / 200); // average read speed
      return {
        id: blog.id,
        title: blog.title,
        body: blog.body,
        category: blog.category,
        image: blog.image,
        postTime: dayjs(blog.createdAt).fromNow(),
        readingTime: `${readingTime} min read`,
        author: {
          fullName: blog.author?.fullName,
          photo: blog.author?.photo,
        },
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: transformed,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};
//fetch a single blog by id
const getBlogById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "Blog ID is required",
      });
    }

    const blog = await db.blogs.findByPk(id);

    if (!blog) {
      return res.status(404).json({
        status: "fail",
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};
//fetch own blog
const ownBlog = async (req, res) => {
  const userId = req.user.id;

  try {
    const blogs = await db.blogs.findAll({
      where: { authorId: userId },
      include: [
        {
          model: db.users,
          as: "author",
          attributes: ["id", "fullName", "photo"],
        },
      ],
    });

    if (!blogs || blogs.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No blog created by the user",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blogs fetched successfully",
      blogs,
    });
  } catch (error) {
    console.error("OwnBlog Error:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

//fetch recent blog
const recentBlog = async (req, res) => {
  try {
    const blogs = await db.blogs.findAll({
      order: [["createdAt", "DESC"]],
      limit: 6,
      include: [
        {
          model: db.users,
          as: "author", 
          attributes: ["fullName", "photo"],
        },
      ],
    });

    if (!blogs || blogs.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No blog posts found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Recent posts fetched successfully",
      blogs,
    });
  } catch (error) {
    console.error("Error fetching recent blogs:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

//fetch a blog by category
const fetchBlogByCategory = async (req, res) => {
  const { category } = req.body;

  try {
    const blogs = await db.blogs.findAll({
      where: { category },
    });

    if (blogs.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No blogs found in this category",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blogs fetched successfully",
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs by category:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

//Like a blog
const toggleLike = async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.id;

  try {
    const blog = await db.blogs.findByPk(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const existingLike = await db.likes.findOne({
      where: { userId, blogId },
    });

    if (existingLike) {
      await existingLike.destroy();
    } else {
      await db.likes.create({ userId, blogId });
    }
    // Get total like count
    const likeCount = await db.likes.count({
      where: { blogId },
    });

    return res.status(200).json({
      liked: !existingLike,
      likeCount,
      message: existingLike ? "Unliked successfully" : "Liked successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// fetching the like state
const getBlogLikeStatus = async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.id;

  try {
    const likeCount = await db.likes.count({ where: { blogId } });

    const userLiked = await db.likes.findOne({
      where: { userId, blogId },
    });

    return res.status(200).json({
      liked: !!userLiked,
      likeCount,
    });
  } catch (error) {
    console.error("Error getting like status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//fetch a popular blog

const getPopularBlogs = async (req, res) => {
  try {
    const blogs = await db.blogs.findAll({
      attributes: {
        include: [
          [
            db.Sequelize.literal(`(
            SELECT COUNT(*) FROM "likes" WHERE "likes"."blogId" = "blog"."id"
          )`),
            "likeCount",
          ],
          [
            db.Sequelize.literal(`(
            SELECT COUNT(*) FROM "comments" WHERE "comments"."blogId" = "blog"."id"
          )`),
            "commentCount",
          ],
        ],
      },
      include: [
        {
          model: db.users,
          as: "author",
          attributes: ["fullName", "photo"],
        },
      ],
      order: [
        [db.Sequelize.literal('"likeCount"'), "DESC"],
        [db.Sequelize.literal('"commentCount"'), "DESC"],
      ],
      limit: 6,
      tableHint: db.Sequelize.TableHints.NOLOCK,
      model: db.blogs,
      as: "blog",
    });

    if (!blogs.length) {
      return res.status(404).json({
        status: "fail",
        message: "No popular blogs found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Popular blogs fetched successfully",
      blogs,
    });
  } catch (error) {
    console.error("Error fetching popular blogs:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBlog,
  updateBlog,
  deleteBlog,
  commentBlog,
  getBlogWithLikeCount,
  allBlog,
  getBlogById,
  toggleLike,
  getBlogLikeStatus,
  blogComments,
  ownBlog,
  recentBlog,
  fetchBlogByCategory,
  getPopularBlogs,
};

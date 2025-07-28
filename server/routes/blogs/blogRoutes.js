const express = require("express");
const blogController = require("../../controllers/blogs/blogController");
const authenticate = require("../../middleware/userAuth");
const upload = require("../../config/multerConfig");
const router = express.Router();

// Add body parser with increased limit
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ limit: '10mb', extended: true }));

router.post(
  "/createBlog",
  authenticate,
  (req, res, next) => {
    console.log('Before multer - headers:', req.headers);
    console.log('Before multer - raw body:', req.body);
    next();
  },
  upload.single("image"),
  (req, res, next) => {
    console.log('After multer - file:', req.file);
    console.log('After multer - body:', req.body);
    next();
  },
  blogController.createBlog
);

router.patch("/updateBlog/:id", authenticate, upload.single("image"), blogController.updateBlog);
router.delete("/deleteBlog/:id", authenticate, blogController.deleteBlog);
router.get("/recent", blogController.recentBlog);
router.post("/category", blogController.fetchBlogByCategory);
router.get("/popular", blogController.getPopularBlogs);
router.post("/like/:blogId", authenticate, blogController.toggleLike);
router.post("/comment/:blogId", authenticate, blogController.commentBlog);
//save a blog
router.post("/save/:blogId", authenticate, blogController.saveBlog);
//unsave a blog
router.delete("/unsave/:blogId", authenticate, blogController.unsaveBlog);
//get saved blogs
router.get("/getSavedBlogs", authenticate, blogController.getSavedBlogs);
router.get("/", blogController.allBlog);
router.get("/me", authenticate, blogController.ownBlog);
router.get("/:id", blogController.getBlogById);
router.get("/like-status/:blogId", authenticate, blogController.getBlogLikeStatus);
router.get("/:blogId/comments", blogController.blogComments);
router.put("/editComment/:commentId", authenticate, blogController.editComment);
router.delete("/deleteComment/:commentId", authenticate, blogController.deleteComment);


module.exports = router;

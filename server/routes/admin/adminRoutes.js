const express = require("express");
const adminController = require("../../controllers/admin/adminController");
const  { authenticate, isAdmin } = require("../../middleware/userAuth");
const router = express.Router();

router.get("/reports", authenticate, isAdmin, adminController.dashboardStats);
router.get("/users", authenticate, isAdmin, adminController.fetchAllUsers);
router.put("/denyBlog/user/:userId", authenticate, isAdmin, adminController.forbidAuthor);
router.put("/allowBlog/user/:userId", authenticate, isAdmin, adminController.allowToPost);
router.delete("/removeUser/user/:userId", authenticate, isAdmin, adminController.removeUser);
router.get("/authorActivity/user/:userId", authenticate, isAdmin, adminController.authorActivity);
router.get("/blogs", authenticate, isAdmin, adminController.fetchAllBlogs);
router.delete("/removeBlog/blog/:blogId", authenticate, isAdmin, adminController.deleteBlog);

module.exports = router;
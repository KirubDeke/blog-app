const express = require('express')
const userController = require('../../controllers/users/userController')
const { authenticate } = require('../../middleware/userAuth')
const router = express.Router()
const upload = require("../../middleware/multer")

router.post('/signup', userController.signup)
//login route
router.post('/login', userController.login)
//refresh token
router.get('/me', userController.getMe)
//sign out
router.post('/signout', userController.signout)
//fetch profile
router.get('/profile', authenticate, userController.profile)
//edit profile
router.put('/editProfile', authenticate, upload.single("photo") , userController.editProfile)
//change password
router.put('/changePassword', authenticate, userController.changePassword)
//author profile
router.get('/author/:authorId', userController.authorProfile);
//create a bio
router.put('/updateBio', authenticate, userController.authorBio);

module.exports = router
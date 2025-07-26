const express = require('express')
const userController = require('../../controllers/users/userController')
const authenticated = require('../../middleware/userAuth')
const router = express.Router()
const upload = require("../../config/multerConfig")

router.post('/signup', userController.signup)
//login route
router.post('/login', userController.login)
//refresh token
router.get('/me', userController.getMe)
//sign out
router.post('/signout', userController.signout)
//fetch profile
router.get('/profile', authenticated, userController.profile)
//edit profile
router.put('/editProfile', authenticated, upload.single("photo") , userController.editProfile)
//change password
router.put('/changePassword', authenticated, userController.changePassword)
//author profile
router.put('/author', authenticated, userController.authorProfile);

module.exports = router
const express = require('express');

const router = express.Router();

const { signUp, verify, logIn, forgotPassword, resetPasswordPage, resetPassword, signOut,updateUserProfile } = require('../controller/userController');
const {authenticate} = require('../middleware/authentation');

//endpoint to register a new user
router.post('/signup', signUp);

//endpoint to verify a registered user
router.get('/verify/:userId', verify);

//endpoint to login a verified user
router.post('/login', logIn);

//endpoint for forget Password
router.post('/forgetpass', forgotPassword);

//endpoint for reset Password Page
router.get('/reset/:userId', resetPasswordPage);

//endpoint to reset user Password
router.post('/resetUser/:userId', resetPassword);

//endpoint to sign out a user
router.post("/signout/:userId", signOut)

//endpoint to update user
router.put("/updateuser/:userId", updateUserProfile)





module.exports = router;
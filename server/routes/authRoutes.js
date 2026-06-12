const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerRules, loginRules, changePasswordRules } = require('../validators/authValidator');

router.post('/register', validate(registerRules), register);
router.post('/login', validate(loginRules), login);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, validate(changePasswordRules), changePassword);

module.exports = router;

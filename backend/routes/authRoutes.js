const express = require('express');
const router = express.Router();
const { login, getMe, getUsers, createUser, deleteUser, resetPassword } = require('../controllers/authController');
const protect = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

router.post('/login',                                login);
router.get('/me',                    protect,        getMe);
router.get('/users',        protect, adminOnly,      getUsers);
router.post('/users',       protect, adminOnly,      createUser);
router.delete('/users/:id', protect, adminOnly,      deleteUser);
router.put('/users/:id/reset-password', protect, adminOnly, resetPassword);

module.exports = router;

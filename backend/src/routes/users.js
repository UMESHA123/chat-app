const express = require('express');
const { searchUsers, getUser, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', searchUsers);        // GET /api/users?q=john
router.patch('/me', updateProfile);  // PATCH /api/users/me — must be before /:id
router.get('/me', (req, res) => res.json({ user: req.user })); // GET /api/users/me
router.get('/:id', getUser);         // GET /api/users/:id

module.exports = router;

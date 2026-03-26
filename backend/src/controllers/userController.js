const User = require('../models/User');

// Escape special regex characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users — search users (for "Select a user" dropdown in Create Chat / Create Group)
const searchUsers = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const safe = escapeRegex(q.trim().slice(0, 100));

    const users = await User.find({
      _id: { $ne: req.user._id }, // exclude self
      $or: [
        { username: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ],
    })
      .select('username email avatar isOnline lastSeen')
      .lean()
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id — get a public user profile
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'username email avatar isOnline lastSeen createdAt'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/me — update own profile (username, avatar)
const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('username email avatar isOnline lastSeen');

    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = { searchUsers, getUser, updateProfile };

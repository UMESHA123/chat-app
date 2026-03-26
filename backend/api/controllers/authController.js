const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ message: 'Email or username already taken' });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user._id);

    res.status(201).json({ token, user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = username or email

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// OAuth callback handler (used by passport strategies)
// Token is passed via hash fragment (#) so it never appears in server logs
// or the Referer header sent to third-party resources.
const oauthCallback = (req, res) => {
  const token = signToken(req.user._id);
  res.redirect(`${process.env.CLIENT_URL}/auth/callback#token=${token}`);
};

module.exports = { register, login, getMe, oauthCallback };

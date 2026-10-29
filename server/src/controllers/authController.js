const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { isAiConfigured } = require('../services/aiService');

const SALT_ROUNDS = 12;

function sendAuth(res, user, statusCode) {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
    aiConfigured: isAiConfigured(),
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, targetRole } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    targetRole: (targetRole || '').trim(),
  });

  sendAuth(res, user, 201);
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const { password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  sendAuth(res, user, 200);
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user.toSafeObject(),
    aiConfigured: isAiConfigured(),
  });
});

module.exports = { register, login, getMe };

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw new AppError('Please log in to access this resource', 401);
  }

  const token = header.slice(7).trim();

  if (!token) {
    throw new AppError('Please log in to access this resource', 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('This account no longer exists. Please register again.', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };

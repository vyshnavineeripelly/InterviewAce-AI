const jwt = require('jsonwebtoken');

function generateToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.includes('<jwt_secret>')) {
    throw new Error(
      'JWT_SECRET is missing or still a placeholder. Set a long random value in server/.env.'
    );
  }

  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;

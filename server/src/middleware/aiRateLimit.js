const rateLimit = require('express-rate-limit');

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many interview or evaluation requests. Please wait and try again.',
  },
  validate: { xForwardedForHeader: false },
});

module.exports = aiRateLimit;

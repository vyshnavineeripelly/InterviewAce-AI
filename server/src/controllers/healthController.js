const { pingDatabase } = require('../services/dbHealthService');
const asyncHandler = require('../middleware/asyncHandler');
const { isAiConfigured } = require('../services/aiService');

const getServerHealth = (req, res) => {
  res.json({
    success: true,
    message: 'InterviewAce AI server is running',
    timestamp: new Date().toISOString(),
    aiConfigured: isAiConfigured(),
  });
};

const getDatabaseHealth = asyncHandler(async (req, res) => {
  const db = await pingDatabase();

  res.json({
    success: true,
    message: 'MongoDB connection is healthy',
    timestamp: new Date().toISOString(),
    db,
  });
});

module.exports = { getServerHealth, getDatabaseHealth };

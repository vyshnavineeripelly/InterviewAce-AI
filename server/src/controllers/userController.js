const { body } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    profile: req.user.toSafeObject(),
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, targetRole, preferredInterviewType, preferredDifficulty, preferredQuestionCount } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = String(name).trim();
  if (targetRole !== undefined) user.targetRole = String(targetRole).trim();
  if (preferredInterviewType !== undefined) {
    user.preferredInterviewType = preferredInterviewType || '';
  }
  if (preferredDifficulty !== undefined) {
    user.preferredDifficulty = preferredDifficulty || '';
  }
  if (preferredQuestionCount !== undefined) {
    user.preferredQuestionCount = preferredQuestionCount;
  }

  await user.save();
  req.user = user;

  res.json({
    success: true,
    profile: user.toSafeObject(),
  });
});

const updateRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
  body('targetRole').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('preferredInterviewType')
    .optional({ values: 'falsy' })
    .isIn(['Technical', 'HR', 'Behavioral', 'Mixed']),
  body('preferredDifficulty').optional({ values: 'falsy' }).isIn(['Beginner', 'Intermediate', 'Advanced']),
  body('preferredQuestionCount').optional().toInt().isIn([5, 10, 15]),
];

module.exports = { getProfile, updateProfile, updateRules };

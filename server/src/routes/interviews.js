const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const aiRateLimit = require('../middleware/aiRateLimit');
const {
  createInterview,
  getInterviews,
  getInterview,
  startInterview,
  submitAnswer,
  nextQuestion,
  finishInterview,
} = require('../controllers/interviewController');

const router = express.Router();

const jobRoles = [
  'Frontend Developer',
  'Backend Developer',
  'MERN Stack Developer',
  'Java Developer',
  'Python Developer',
  'Custom Role',
];
const interviewTypes = ['Technical', 'HR', 'Behavioral', 'Mixed'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const idRule = param('id').isMongoId().withMessage('Invalid interview ID');

const createRules = [
  body('jobRole').isIn(jobRoles).withMessage('Select a valid job role'),
  body('customRole')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Custom role must be 80 characters or fewer'),
  body('customRole').custom((value, { req }) => {
    if (req.body.jobRole === 'Custom Role' && (!value || !String(value).trim())) {
      throw new Error('Custom role is required when Job role is Custom Role');
    }
    return true;
  }),
  body('interviewType').isIn(interviewTypes).withMessage('Select a valid interview type'),
  body('difficulty').isIn(difficulties).withMessage('Select a valid difficulty'),
  body('questionCount').toInt().isIn([5, 10, 15]).withMessage('Question count must be 5, 10, or 15'),
  body('topics').optional().isArray({ max: 8 }).withMessage('Topics must be an array with at most 8 items'),
  body('topics.*').optional().isString().trim().isLength({ max: 60 }),
];

router.use(protect);
router.post('/', aiRateLimit, createRules, validateRequest, createInterview);
router.get('/', getInterviews);
router.get('/:id', idRule, validateRequest, getInterview);
router.post('/:id/start', aiRateLimit, idRule, validateRequest, startInterview);
router.post(
  '/:id/answers',
  aiRateLimit,
  idRule,
  body('questionId').isMongoId().withMessage('A valid questionId is required'),
  body('answerText').isString().withMessage('Answer text is required'),
  validateRequest,
  submitAnswer
);
router.post('/:id/next', idRule, validateRequest, nextQuestion);
router.post('/:id/finish', idRule, validateRequest, finishInterview);

module.exports = router;

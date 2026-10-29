const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Response = require('../models/Response');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateQuestions, evaluateAnswer, isAiConfigured } = require('../services/aiService');

async function getOwnedInterview(id, userId) {
  const interview = await Interview.findOne({ _id: id, user: userId });
  if (!interview) {
    throw new AppError('Interview not found', 404);
  }
  return interview;
}

async function serializeInterview(interview) {
  const [questions, responses] = await Promise.all([
    Question.find({ interview: interview._id, user: interview.user }).sort({ order: 1 }),
    Response.find({ interview: interview._id, user: interview.user }).sort({ createdAt: 1 }),
  ]);

  return {
    ...interview.toObject(),
    displayRole: interview.displayRole(),
    questions,
    responses,
  };
}

async function insertQuestions(interview, questionPayloads, startOrder = 0) {
  const docs = questionPayloads.map((item, index) => ({
    interview: interview._id,
    user: interview.user,
    order: startOrder + index,
    text: item.text,
    topic: item.topic || '',
    source: item.source || 'sample',
    isFollowUp: Boolean(item.isFollowUp),
  }));
  return Question.insertMany(docs);
}

const createInterview = asyncHandler(async (req, res) => {
  const { jobRole, customRole = '', interviewType, difficulty, questionCount, topics = [] } = req.body;
  const cleanTopics = Array.isArray(topics) ? topics.map((topic) => String(topic).trim()).filter(Boolean) : [];

  const generated = await generateQuestions({
    jobRole,
    customRole: customRole.trim(),
    interviewType,
    difficulty,
    questionCount,
    topics: cleanTopics,
  });

  const interview = await Interview.create({
    user: req.user._id,
    jobRole,
    customRole: jobRole === 'Custom Role' ? customRole.trim() : '',
    interviewType,
    difficulty,
    questionCount,
    topics: cleanTopics,
    status: 'created',
    currentQuestionIndex: 0,
    questionSource: generated.source,
  });

  const questions = await insertQuestions(interview, generated.questions);

  res.status(201).json({
    success: true,
    interview: {
      ...(await serializeInterview(interview)),
      questions,
    },
    ai: {
      configured: isAiConfigured(),
      source: generated.source,
      usedFallback: Boolean(generated.usedFallback),
    },
  });
});

const getInterviews = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    interviews: interviews.map((interview) => ({
      ...interview.toObject(),
      displayRole: interview.displayRole(),
    })),
  });
});

const getInterview = asyncHandler(async (req, res) => {
  const interview = await getOwnedInterview(req.params.id, req.user._id);
  res.json({ success: true, interview: await serializeInterview(interview) });
});

const startInterview = asyncHandler(async (req, res) => {
  const interview = await getOwnedInterview(req.params.id, req.user._id);

  if (interview.status === 'completed') {
    throw new AppError('This interview is already completed', 400);
  }

  if (interview.status === 'created') {
    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();
  }

  res.json({ success: true, interview: await serializeInterview(interview) });
});

const submitAnswer = asyncHandler(async (req, res) => {
  const interview = await getOwnedInterview(req.params.id, req.user._id);

  if (interview.status === 'completed') {
    throw new AppError('This interview is already completed', 400);
  }

  delete req.body.evaluation;
  delete req.body.score;
  delete req.body.scores;

  const answerText = String(req.body.answerText || '').trim();
  if (!answerText) {
    throw new AppError('Answer cannot be empty', 400);
  }

  const question = await Question.findOne({
    _id: req.body.questionId,
    interview: interview._id,
    user: req.user._id,
  });

  if (!question) {
    throw new AppError('Question not found for this interview', 404);
  }

  if (question.order !== interview.currentQuestionIndex) {
    throw new AppError('Save the current question before moving ahead', 409);
  }

  const existing = await Response.findOne({ question: question._id, user: req.user._id });
  if (existing) {
    throw new AppError('This question already has an answer', 409);
  }

  if (interview.status === 'created') {
    interview.status = 'in-progress';
    interview.startedAt = interview.startedAt || new Date();
  }

  let evaluation = undefined;
  let followUpQuestion = '';
  let evaluationSkipped = true;
  let evaluationError = '';

  try {
    const result = await evaluateAnswer({
      role: interview.displayRole(),
      difficulty: interview.difficulty,
      questionText: question.text,
      answerText,
    });
    evaluation = result.evaluation || undefined;
    followUpQuestion = result.followUpQuestion || '';
    evaluationSkipped = Boolean(result.skipped) || !evaluation;
  } catch (error) {
    evaluation = undefined;
    evaluationSkipped = true;
    evaluationError = `The answer was saved, but the LLM did not return feedback (${error.message}). No practice scores were invented.`;
  }

  const response = await Response.create({
    interview: interview._id,
    question: question._id,
    user: req.user._id,
    answerText,
    evaluation,
  });

  if (followUpQuestion && interview.followUpCount < 2) {
    const laterQuestions = await Question.find({
      interview: interview._id,
      order: { $gt: question.order },
    }).sort({ order: -1 });

    for (const later of laterQuestions) {
      later.order += 1;
      await later.save();
    }

    await Question.create({
      interview: interview._id,
      user: req.user._id,
      order: question.order + 1,
      text: followUpQuestion,
      topic: question.topic,
      source: 'ai',
      isFollowUp: true,
    });

    interview.followUpCount += 1;
    interview.questionCount += 1;
  }

  await interview.save();

  res.status(201).json({
    success: true,
    response,
    interview: await serializeInterview(interview),
    evaluationSkipped,
    evaluationError: evaluationError || undefined,
  });
});

const nextQuestion = asyncHandler(async (req, res) => {
  const interview = await getOwnedInterview(req.params.id, req.user._id);

  if (interview.status === 'completed') {
    throw new AppError('This interview is already completed', 400);
  }

  const questions = await Question.find({ interview: interview._id, user: req.user._id }).sort({ order: 1 });
  const current = questions.find((item) => item.order === interview.currentQuestionIndex);

  if (!current) {
    throw new AppError('Current question was not found', 404);
  }

  const answered = await Response.findOne({ question: current._id, user: req.user._id });
  if (!answered) {
    throw new AppError('Save an answer before continuing', 400);
  }

  if (interview.currentQuestionIndex >= questions.length - 1) {
    throw new AppError('This is the last question. Finish the interview instead.', 400);
  }

  interview.currentQuestionIndex += 1;
  await interview.save();

  res.json({ success: true, interview: await serializeInterview(interview) });
});

const finishInterview = asyncHandler(async (req, res) => {
  const interview = await getOwnedInterview(req.params.id, req.user._id);

  if (interview.status === 'completed') {
    return res.json({ success: true, interview: await serializeInterview(interview) });
  }

  const questions = await Question.find({ interview: interview._id, user: req.user._id });
  const responses = await Response.find({ interview: interview._id, user: req.user._id });

  if (responses.length < questions.length) {
    throw new AppError('Answer every question before finishing', 400);
  }

  const evaluated = responses.filter((item) => item.evaluation);
  const averages = evaluated.map((item) => {
    const evaln = item.evaluation;
    return (evaln.correctness + evaln.relevance + evaln.completeness + evaln.clarity) / 4;
  });

  interview.status = 'completed';
  interview.completedAt = new Date();
  interview.scoreSummary = {
    evaluatedCount: evaluated.length,
    average: averages.length
      ? Math.round((averages.reduce((sum, value) => sum + value, 0) / averages.length) * 10) / 10
      : null,
  };
  await interview.save();

  res.json({ success: true, interview: await serializeInterview(interview) });
});

module.exports = {
  createInterview,
  getInterviews,
  getInterview,
  startInterview,
  submitAnswer,
  nextQuestion,
  finishInterview,
};

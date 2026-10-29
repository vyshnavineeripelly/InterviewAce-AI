const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Response = require('../models/Response');
const { isAiConfigured } = require('../services/aiService');
const asyncHandler = require('../middleware/asyncHandler');

function round1(value) {
  return Math.round(value * 10) / 10;
}

const getPerformance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const interviews = await Interview.find({ user: userId }).sort({ createdAt: 1 });
  const questions = await Question.find({ user: userId }).select('_id topic interview');
  const responses = await Response.find({ user: userId });

  const questionById = new Map(questions.map((item) => [String(item._id), item]));
  const evaluated = responses.filter((item) => item.evaluation && Number.isFinite(item.evaluation.overall));

  const topicTotals = new Map();
  for (const response of evaluated) {
    const question = questionById.get(String(response.question));
    const topic = (question?.topic || 'General').trim() || 'General';
    const current = topicTotals.get(topic) || { topic, total: 0, count: 0 };
    current.total += response.evaluation.overall;
    current.count += 1;
    topicTotals.set(topic, current);
  }

  const topicStats = [...topicTotals.values()]
    .map((item) => ({
      topic: item.topic,
      count: item.count,
      average: round1(item.total / item.count),
    }))
    .sort((a, b) => b.average - a.average);

  const strongTopics = topicStats.filter((item) => item.average >= 7);
  const weakTopics = topicStats.filter((item) => item.average < 6).sort((a, b) => a.average - b.average);

  const completed = interviews.filter((item) => item.status === 'completed');
  const progress = completed
    .filter((item) => item.scoreSummary?.average != null)
    .map((item) => ({
      id: item._id,
      date: item.completedAt || item.updatedAt,
      role: item.displayRole(),
      average: item.scoreSummary.average,
      evaluatedCount: item.scoreSummary.evaluatedCount || 0,
    }));

  const scoredAverages = progress.map((item) => item.average);
  const overallAverage = scoredAverages.length
    ? round1(scoredAverages.reduce((sum, value) => sum + value, 0) / scoredAverages.length)
    : null;

  const recent = [...interviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((item) => ({
      ...item.toObject(),
      displayRole: item.displayRole(),
    }));

  res.json({
    success: true,
    aiConfigured: isAiConfigured(),
    stats: {
      totalInterviews: interviews.length,
      completedInterviews: completed.length,
      inProgress: interviews.filter((item) => item.status === 'in-progress').length,
      evaluatedAnswers: evaluated.length,
      overallAverage,
    },
    progress,
    topicStats,
    strongTopics,
    weakTopics,
    history: completed
      .slice()
      .reverse()
      .map((item) => ({
        id: item._id,
        role: item.displayRole(),
        interviewType: item.interviewType,
        difficulty: item.difficulty,
        status: item.status,
        average: item.scoreSummary?.average ?? null,
        evaluatedCount: item.scoreSummary?.evaluatedCount || 0,
        completedAt: item.completedAt,
      })),
    recent,
  });
});

module.exports = { getPerformance };

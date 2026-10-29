const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    correctness: { type: Number, min: 0, max: 10 },
    relevance: { type: Number, min: 0, max: 10 },
    completeness: { type: Number, min: 0, max: 10 },
    clarity: { type: Number, min: 0, max: 10 },
    missingConcepts: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    mistakes: { type: [String], default: [] },
    improvementTips: { type: [String], default: [] },
    correctAnswer: { type: String, default: '' },
    improvedAnswer: { type: String, default: '' },
    feedback: { type: String, default: '' },
    overall: { type: Number, min: 0, max: 10 },
    provider: { type: String, default: '' },
    model: { type: String, default: '' },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answerText: { type: String, required: true, trim: true, maxlength: 8000 },
    evaluation: { type: evaluationSchema, default: undefined },
  },
  { timestamps: true }
);

responseSchema.index({ question: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Response', responseSchema);

const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobRole: {
      type: String,
      required: true,
      enum: [
        'Frontend Developer',
        'Backend Developer',
        'MERN Stack Developer',
        'Java Developer',
        'Python Developer',
        'Custom Role',
      ],
    },
    customRole: { type: String, trim: true, maxlength: 80, default: '' },
    interviewType: {
      type: String,
      required: true,
      enum: ['Technical', 'HR', 'Behavioral', 'Mixed'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    questionCount: { type: Number, required: true, min: 5, max: 20 },
    topics: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
    status: {
      type: String,
      enum: ['created', 'in-progress', 'completed'],
      default: 'created',
      index: true,
    },
    currentQuestionIndex: { type: Number, default: 0, min: 0 },
    questionSource: { type: String, enum: ['sample', 'ai'], default: 'sample' },
    followUpCount: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    scoreSummary: {
      evaluatedCount: { type: Number, default: 0 },
      average: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

interviewSchema.pre('validate', function validateCustomRole() {
  if (this.jobRole === 'Custom Role' && !String(this.customRole || '').trim()) {
    this.invalidate('customRole', 'Custom role is required when Job role is Custom Role');
  }
});

interviewSchema.methods.displayRole = function displayRole() {
  return this.jobRole === 'Custom Role' ? this.customRole : this.jobRole;
};

module.exports = mongoose.model('Interview', interviewSchema);

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Number, required: true, min: 0 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    topic: { type: String, trim: true, default: '', maxlength: 80 },
    source: { type: String, enum: ['sample', 'ai'], default: 'sample' },
    isFollowUp: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ interview: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Question', questionSchema);

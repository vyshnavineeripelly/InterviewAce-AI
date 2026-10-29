const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be 80 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    targetRole: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Target role must be 80 characters or fewer'],
    },
    preferredInterviewType: {
      type: String,
      enum: ['', 'Technical', 'HR', 'Behavioral', 'Mixed'],
      default: '',
    },
    preferredDifficulty: {
      type: String,
      enum: ['', 'Beginner', 'Intermediate', 'Advanced'],
      default: '',
    },
    preferredQuestionCount: {
      type: Number,
      enum: [5, 10, 15],
      default: 5,
    },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    targetRole: this.targetRole,
    preferredInterviewType: this.preferredInterviewType || '',
    preferredDifficulty: this.preferredDifficulty || '',
    preferredQuestionCount: this.preferredQuestionCount || 5,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);

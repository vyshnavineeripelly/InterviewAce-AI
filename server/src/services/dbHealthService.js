const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

async function pingDatabase() {
  const state = mongoose.connection.readyState;

  if (state !== 1 || !mongoose.connection.db) {
    throw new AppError('MongoDB is not connected', 503);
  }

  await mongoose.connection.db.admin().command({ ping: 1 });

  return {
    connected: true,
    readyState: state,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}

module.exports = { pingDatabase };

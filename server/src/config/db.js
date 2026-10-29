const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<db_password>') || uri.includes('<db_username>')) {
    throw new Error(
      'MONGODB_URI is missing or still a placeholder. Copy server/.env.example to server/.env and paste your Atlas connection string locally. Do not commit .env.'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;

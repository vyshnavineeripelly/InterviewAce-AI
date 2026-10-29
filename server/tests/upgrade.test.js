process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-production';
process.env.JWT_EXPIRES_IN = '1h';
delete process.env.AI_API_KEY;

const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');

async function register(name, email) {
  const response = await request(app).post('/api/auth/register').send({
    name,
    email,
    password: 'CorrectHorse1',
    targetRole: 'Java Developer',
  });
  assert.equal(response.status, 201);
  return response.body.token;
}

async function run() {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const tokenA = await register('Student A', 'upgrade-a@example.com');
    const tokenB = await register('Student B', 'upgrade-b@example.com');

    const updated = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Student A Prime',
        targetRole: 'Python Developer',
        preferredInterviewType: 'Technical',
        preferredDifficulty: 'Advanced',
        preferredQuestionCount: 10,
      });
    assert.equal(updated.status, 200, updated.body.message);
    assert.equal(updated.body.profile.targetRole, 'Python Developer');
    assert.equal(updated.body.profile.preferredQuestionCount, 10);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenA}`);
    assert.equal(me.body.user.name, 'Student A Prime');
    assert.equal(me.body.aiConfigured, false);

    const created = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        jobRole: 'Python Developer',
        interviewType: 'Technical',
        difficulty: 'Beginner',
        questionCount: 5,
        topics: ['Python'],
      });
    assert.equal(created.status, 201);
    const interviewId = created.body.interview._id;
    await request(app).post(`/api/interviews/${interviewId}/start`).set('Authorization', `Bearer ${tokenA}`);

    for (let index = 0; index < 5; index += 1) {
      const current = await request(app).get(`/api/interviews/${interviewId}`).set('Authorization', `Bearer ${tokenA}`);
      const question = current.body.interview.questions.find(
        (item) => item.order === current.body.interview.currentQuestionIndex
      );
      const saved = await request(app)
        .post(`/api/interviews/${interviewId}/answers`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ questionId: question._id, answerText: `Real answer ${index + 1}` });
      assert.equal(saved.status, 201);
      assert.equal(saved.body.response.evaluation, undefined);
      assert.equal(saved.body.evaluationSkipped, true);
      if (index < 4) {
        await request(app).post(`/api/interviews/${interviewId}/next`).set('Authorization', `Bearer ${tokenA}`);
      }
    }

    await request(app).post(`/api/interviews/${interviewId}/finish`).set('Authorization', `Bearer ${tokenA}`);

    const statsA = await request(app).get('/api/performance').set('Authorization', `Bearer ${tokenA}`);
    assert.equal(statsA.status, 200);
    assert.equal(statsA.body.stats.completedInterviews, 1);
    assert.equal(statsA.body.stats.overallAverage, null);
    assert.equal(statsA.body.strongTopics.length, 0);

    const statsB = await request(app).get('/api/performance').set('Authorization', `Bearer ${tokenB}`);
    assert.equal(statsB.body.stats.totalInterviews, 0);

    console.log('Upgrade tests passed: profile save, missing AI key, isolated performance stats.');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

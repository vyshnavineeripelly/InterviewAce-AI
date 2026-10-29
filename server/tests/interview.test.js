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
  });
  assert.equal(response.status, 201);
  return response.body.token;
}

async function createSession(token, overrides = {}) {
  const created = await request(app)
    .post('/api/interviews')
    .set('Authorization', `Bearer ${token}`)
    .send({
      jobRole: 'Frontend Developer',
      interviewType: 'Technical',
      difficulty: 'Beginner',
      questionCount: 5,
      topics: ['React'],
      ...overrides,
    });
  assert.equal(created.status, 201, created.body.message);
  return created.body.interview;
}

async function runSampleEngine() {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const tokenA = await register('Student A', 'student-a@example.com');
    const tokenB = await register('Student B', 'student-b@example.com');

    const invalid = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ jobRole: 'Custom Role', interviewType: 'Technical', difficulty: 'Beginner', questionCount: 5 });
    assert.equal(invalid.status, 400);

    const interview = await createSession(tokenA);
    assert.equal(interview.status, 'created');
    assert.equal(interview.questions.length, 5);
    assert.equal(interview.questionSource, 'sample');

    const historyA = await request(app).get('/api/interviews').set('Authorization', `Bearer ${tokenA}`);
    assert.equal(historyA.body.interviews.length, 1);

    const historyB = await request(app).get('/api/interviews').set('Authorization', `Bearer ${tokenB}`);
    assert.equal(historyB.body.interviews.length, 0);

    const stolen = await request(app)
      .get(`/api/interviews/${interview._id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert.equal(stolen.status, 404);

    const started = await request(app)
      .post(`/api/interviews/${interview._id}/start`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(started.status, 200);
    assert.equal(started.body.interview.status, 'in-progress');

    const empty = await request(app)
      .post(`/api/interviews/${interview._id}/answers`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ questionId: interview.questions[0]._id, answerText: '   ' });
    assert.equal(empty.status, 400);

    for (let index = 0; index < 5; index += 1) {
      const current = await request(app)
        .get(`/api/interviews/${interview._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      const question = current.body.interview.questions.find(
        (item) => item.order === current.body.interview.currentQuestionIndex
      );

      const saved = await request(app)
        .post(`/api/interviews/${interview._id}/answers`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ questionId: question._id, answerText: `Answer ${index + 1} about the prompt.` });
      assert.equal(saved.status, 201, saved.body.message);

      const duplicate = await request(app)
        .post(`/api/interviews/${interview._id}/answers`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ questionId: question._id, answerText: 'Second try' });
      assert.equal(duplicate.status, 409);

      if (index < 4) {
        const next = await request(app)
          .post(`/api/interviews/${interview._id}/next`)
          .set('Authorization', `Bearer ${tokenA}`);
        assert.equal(next.status, 200);
      }
    }

    const recovered = await request(app)
      .get(`/api/interviews/${interview._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(recovered.body.interview.responses.length, 5);
    assert.equal(recovered.body.interview.currentQuestionIndex, 4);

    const finished = await request(app)
      .post(`/api/interviews/${interview._id}/finish`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(finished.status, 200);
    assert.equal(finished.body.interview.status, 'completed');

    const otherAnswer = await request(app)
      .post(`/api/interviews/${interview._id}/answers`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ questionId: interview.questions[0]._id, answerText: 'Hijack' });
    assert.equal(otherAnswer.status, 404);

    console.log('Sample interview tests passed: create, history, isolation, answers, recovery, finish.');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

async function runAiEngine() {
  process.env.AI_API_KEY = 'sk-test-placeholder-not-a-real-secret';
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_MODEL = 'gpt-4o-mini';

  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    const userMessage = body.messages.find((item) => item.role === 'user')?.content || '';
    const isEval = userMessage.includes('Student answer');
    const payload = isEval
      ? {
          correctness: 7,
          relevance: 8,
          completeness: 5,
          clarity: 7,
          strengths: ['Names React rendering'],
          weaknesses: ['No concrete example'],
          mistakes: ['Did not mention keys'],
          missingConcepts: ['virtual DOM'],
          improvementTips: ['Describe list reconciliation with an example'],
          correctAnswer: 'React compares trees and reuses nodes with stable keys.',
          improvedAnswer: 'A stronger answer would mention reconciliation.',
          feedback: 'The answer is relevant but incomplete.',
          followUpQuestion: indexFollowUp(userMessage),
        }
      : {
          questions: [
            { text: 'How does React reconcile a changed list?', topic: 'React' },
            { text: 'What is a key in a React list and why does it matter?', topic: 'React' },
            { text: 'How would you fetch data in a React page?', topic: 'React' },
            { text: 'Explain controlled versus uncontrolled inputs.', topic: 'React' },
            { text: 'How do you lift state in a small React app?', topic: 'React' },
          ],
        };

    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(payload) } }],
      }),
    };
  };

  let followUps = 0;
  function indexFollowUp(message) {
    if (followUps >= 1) return '';
    if (message.includes('Answer 1')) {
      followUps += 1;
      return 'Can you give a concrete example from a list UI?';
    }
    return '';
  }

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const token = await register('Student AI', 'student-ai@example.com');
    const created = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobRole: 'Frontend Developer',
        interviewType: 'Technical',
        difficulty: 'Intermediate',
        questionCount: 5,
        topics: ['React'],
      });

    assert.equal(created.status, 201, created.body.message);
    assert.equal(created.body.interview.questionSource, 'ai');
    assert.match(created.body.interview.questions[0].text, /reconcile/i);

    await request(app)
      .post(`/api/interviews/${created.body.interview._id}/start`)
      .set('Authorization', `Bearer ${token}`);

    const firstQuestion = created.body.interview.questions[0];
    const firstAnswer = await request(app)
      .post(`/api/interviews/${created.body.interview._id}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId: firstQuestion._id, answerText: 'Answer 1: React re-renders components.' });

    assert.equal(firstAnswer.status, 201, firstAnswer.body.message);
    assert.equal(firstAnswer.body.response.evaluation.correctness, 7);
    assert.ok(firstAnswer.body.response.evaluation.strengths.length);
    assert.equal(firstAnswer.body.interview.questions.some((item) => item.isFollowUp), true);

    const clientScore = await request(app)
      .post(`/api/interviews/${created.body.interview._id}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionId: firstQuestion._id,
        answerText: 'Ignored duplicate',
        evaluation: { correctness: 10 },
      });
    assert.equal(clientScore.status, 409);

    console.log('AI interview tests passed: generated questions, server-side evaluation, follow-up, ignored client scores.');
  } finally {
    global.fetch = originalFetch;
    delete process.env.AI_API_KEY;
    await mongoose.disconnect();
    await mongo.stop();
  }
}

async function run() {
  await runSampleEngine();
  await runAiEngine();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

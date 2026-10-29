process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.FRONTEND_URL = 'http://localhost:5173';

const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

async function run() {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const uniqueEmail = `phase3.${Date.now()}@example.com`;
  const password = 'CorrectHorse1';
  let token;

  try {
    const invalidRegister = await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });
    assert.equal(invalidRegister.status, 400);
    assert.equal(invalidRegister.body.success, false);

    const register = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: uniqueEmail,
      password,
      targetRole: 'Frontend Engineer',
    });
    assert.equal(register.status, 201);
    assert.equal(register.body.success, true);
    assert.ok(register.body.token);
    assert.equal(register.body.user.email, uniqueEmail);
    assert.equal(register.body.user.passwordHash, undefined);
    assert.equal(register.body.user.password, undefined);
    token = register.body.token;

    const stored = await User.findOne({ email: uniqueEmail }).select('+passwordHash');
    assert.ok(stored.passwordHash);
    assert.notEqual(stored.passwordHash, password);
    assert.equal(stored.password, undefined);

    const duplicate = await request(app).post('/api/auth/register').send({
      name: 'Ada Clone',
      email: uniqueEmail,
      password,
    });
    assert.equal(duplicate.status, 409);

    const unauthenticated = await request(app).get('/api/auth/me');
    assert.equal(unauthenticated.status, 401);

    const badPassword = await request(app).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'WrongPassword1',
    });
    assert.equal(badPassword.status, 401);
    assert.match(badPassword.body.message, /Invalid email or password/i);

    const login = await request(app).post('/api/auth/login').send({
      email: uniqueEmail,
      password,
    });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
    token = login.body.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + token);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, uniqueEmail);
    assert.equal(me.body.user.name, 'Ada Lovelace');
    assert.equal(me.body.user.passwordHash, undefined);

    const profile = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer ' + token);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.profile.email, uniqueEmail);

    const forged = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer not-a-real-token');
    assert.equal(forged.status, 401);

    console.log('Auth tests passed: register, duplicate email, invalid password, JWT, protected routes.');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
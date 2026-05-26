const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');

let mongoServer;
let serverObj;
let request;

jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';

  // start server programmatically
  const srv = require('../server');
  serverObj = await srv.startServer(uri);
  request = supertest(`http://localhost:${process.env.PORT || 5000}`);
});

afterAll(async () => {
  // close server and mongo
  if (serverObj && serverObj.server) await serverObj.server.close();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  // clean DB
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

test('renew endpoint extends dueDate and returns remainingRenewals', async () => {
  // create user
  const user = await User.create({ name: 'Test Student', email: 's1@test.com', password: 'pw', customId: 's1', role: 'Student' });
  // create book (include required fields)
  const book = await Book.create({ title: 'Test Book', customId: 'TB001', author: 'Tester', department: 'General', isbn: 'ISBN-TEST-001', image: 'http://example.com/book.jpg', totalCopies: 3, availableCopies: 3 });
  // create approved borrow request
  const issueDate = new Date();
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
  const borrow = await BorrowRequest.create({ user: user._id, book: book._id, status: 'Approved', issueDate, dueDate, renewalCount: 0 });

  // generate token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

  const res = await request.put(`/api/requests/${borrow._id}/renew`).set('Authorization', `Bearer ${token}`);
  // debug on non-200
  if (res.status !== 200) console.error('RENEW RESPONSE', res.status, res.body);

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('remainingRenewals');
  expect(res.body.remainingRenewals).toBe(1);
  expect(res.body).toHaveProperty('request');
  expect(res.body.request.renewalCount).toBe(1);

  const updated = await BorrowRequest.findById(borrow._id);
  expect(new Date(updated.dueDate) > dueDate).toBeTruthy();
});

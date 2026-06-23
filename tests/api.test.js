const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../src/app');

const snapshotFile = path.join(__dirname, 'fixtures', 'snapshot.json');
const config = { snapshotFile, port: 3999 };
const app = createApp(config);

test('health endpoint returns healthy status', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'healthy');
});

test('dashboard endpoint returns snapshot data', async () => {
  const response = await request(app).get('/api/dashboard');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.summary.openLoopCount, 2);
});

test('projects endpoint returns active project list', async () => {
  const response = await request(app).get('/api/projects');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.active[0].name, 'Projects Hub');
});

test('dashboard summary includes weekly recaps', async () => {
  const response = await request(app).get('/api/dashboard');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.summary.weeklyRecaps.length, 1);
  assert.equal(response.body.summary.weeklyRecaps[0].done[0].text, 'Deployed the dashboard');
});

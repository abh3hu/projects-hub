const express = require('express');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { loadSnapshot } = require('./lib/buildSnapshot');

function createApp(config) {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  function getSnapshot() {
    if (!fs.existsSync(config.snapshotFile)) {
      const error = new Error(`Snapshot file not found: ${config.snapshotFile}`);
      error.statusCode = 503;
      throw error;
    }
    return loadSnapshot(config.snapshotFile);
  }

  app.get('/health', (req, res) => {
    try {
      const snapshot = getSnapshot();
      res.json({
        status: 'healthy',
        service: 'projects-hub',
        generatedAt: snapshot.generatedAt,
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ status: 'unhealthy', error: error.message });
    }
  });

  app.get('/api/dashboard', (req, res, next) => {
    try { res.json(getSnapshot()); } catch (error) { next(error); }
  });
  app.get('/api/summary', (req, res, next) => {
    try { res.json(getSnapshot().summary); } catch (error) { next(error); }
  });
  app.get('/api/projects', (req, res, next) => {
    try { res.json(getSnapshot().projects); } catch (error) { next(error); }
  });
  app.get('/api/loops', (req, res, next) => {
    try { res.json(getSnapshot().openLoops); } catch (error) { next(error); }
  });
  app.get('/api/conversations', (req, res, next) => {
    try { res.json(getSnapshot().conversations); } catch (error) { next(error); }
  });
  app.get('/api/graph', (req, res, next) => {
    try { res.json(getSnapshot().graph); } catch (error) { next(error); }
  });

  app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({ error: error.message || 'Unexpected error' });
  });

  return app;
}

module.exports = { createApp };

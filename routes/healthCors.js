const express = require('express');

const router = express.Router();

// GET /api/health/cors - report origin normalization and allowance
router.get('/cors', (req, res) => {
  const origin = req.headers.origin || null;
  const normalized = origin ? origin.replace(/\/+$/, '') : null;

  const whitelist = [
    'https://practicalportal.vercel.app',
    'http://localhost:3000'
  ];

  const allowed = normalized ? whitelist.includes(normalized) : false;

  res.json({
    originReceived: origin,
    normalizedOrigin: normalized,
    allowed,
    responseHeaders: {
      'Access-Control-Allow-Origin': normalized && allowed ? normalized : undefined,
      'Access-Control-Allow-Credentials': 'true'
    }
  });
});

module.exports = router;




const rateLimit = require('express-rate-limit');

const viewRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many view requests, try again later.' }
});

module.exports = { viewRateLimiter };

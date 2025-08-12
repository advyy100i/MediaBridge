const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ error: 'Missing stream token' });
    const payload = jwt.verify(token, process.env.STREAM_TOKEN_SECRET);
    req.streamPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired stream token' });
  }
};

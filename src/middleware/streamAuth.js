const jwt = require('jsonwebtoken');
const secret = process.env.STREAM_TOKEN_SECRET;

module.exports = (req, res, next) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Missing stream token' });
  try {
    const payload = jwt.verify(token, secret);
    // payload should include: mediaId and exp
    req.streamPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired stream token' });
  }
};

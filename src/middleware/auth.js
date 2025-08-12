const jwt = require('jsonwebtoken');
const User = require('../models/AdminUser');
const secret = process.env.JWT_SECRET;

module.exports = async function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // { id, email, iat, exp }
    // Optionally fetch user from DB to validate still admin
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

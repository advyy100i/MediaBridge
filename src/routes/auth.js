const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new AdminUser({ email, hashed_password: hashed });
    await user.save();
    res.status(201).json({ message: 'created' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'email already exists' });
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await AdminUser.findOne({ email });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.hashed_password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

module.exports = router;

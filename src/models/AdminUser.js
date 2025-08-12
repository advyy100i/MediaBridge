const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  hashed_password: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);

const mongoose = require('mongoose');

const MediaViewLogSchema = new mongoose.Schema({
  media_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset', required: true },
  viewed_by_ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MediaViewLog', MediaViewLogSchema);

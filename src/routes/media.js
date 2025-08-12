const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const auth = require('../middleware/auth');
const streamAuth = require('../middleware/streamAuth');
const MediaAsset = require('../models/MediaAsset');
const MediaViewLog = require('../models/MediaViewLog');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// POST /media
// authenticated admin route
router.post('/', auth, upload.single('file'), async (req, res) => {
  // expects fields: title, type (video|audio), file (multipart)
  const { title, type } = req.body;
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  if (!title || !type) return res.status(400).json({ error: 'title and type required' });

  const fileUrl = `/uploads/${req.file.filename}`; // or S3 URL
  const media = new MediaAsset({ title, type, file_url: fileUrl });
  await media.save();
  res.status(201).json({ media });
});

// GET /media/:id/stream-url
// returns a signed URL valid for STREAM_TOKEN_EXP_SECONDS
router.get('/:id/stream-url', auth, async (req, res) => {
  const media = await MediaAsset.findById(req.params.id);
  if (!media) return res.status(404).json({ error: 'not found' });

  const secret = process.env.STREAM_TOKEN_SECRET;
  const expiresIn = parseInt(process.env.STREAM_TOKEN_EXP_SECONDS || '600', 10); // seconds
  const token = jwt.sign({ mediaId: media._id }, secret, { expiresIn: expiresIn + 's' });
  // Construct the stream URL (assuming same host)
  const host = req.get('host');
  const protocol = req.protocol;
  const streamUrl = `${protocol}://${host}/media/${media._id}/stream?token=${token}`;
  res.json({ stream_url: streamUrl, expires_in_seconds: expiresIn });
});

// GET /media/:id/stream
// Validates stream token and streams file, and logs IP/timestamp
router.get('/:id/stream', streamAuth, async (req, res) => {
  // streamAuth has verified token and placed payload
  const tokenMediaId = req.streamPayload.mediaId;
  if (tokenMediaId !== req.params.id) return res.status(403).json({ error: 'token-media mismatch' });

  const media = await MediaAsset.findById(req.params.id);
  if (!media) return res.status(404).json({ error: 'media not found' });

  // Log viewer IP
  const viewerIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0].trim();
  await MediaViewLog.create({ media_id: media._id, viewed_by_ip: viewerIp });

  // Serve the file from local uploads (supports range)
  const filePath = path.join(process.cwd(), media.file_url.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file missing' });

  const stat = fs.statSync(filePath);
  const total = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
    if (start >= total || end >= total) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + total);
      return;
    }
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': media.type === 'video' ? 'video/mp4' : 'audio/mpeg'
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': media.type === 'video' ? 'video/mp4' : 'audio/mpeg'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

module.exports = router;

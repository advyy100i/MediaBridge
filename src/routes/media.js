const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const auth = require('../middleware/auth');
const streamAuth = require('../middleware/streamAuth');
const { viewRateLimiter } = require('../middleware/rateLimiter');
const MediaAsset = require('../models/MediaAsset');
const MediaViewLog = require('../models/MediaViewLog');
const redisClient = require('../redisClient');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// helper: get client ip and normalize
const getClientIp = (req) => {
  const x = req.headers['x-forwarded-for'];
  if (x) return x.split(',')[0].trim();
  let ip = req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || '';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return ip;
};

// POST /media -> upload metadata + file
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, type } = req.body;
    if (!req.file) return res.status(400).json({ error: 'file required' });
    if (!title || !type) return res.status(400).json({ error: 'title and type required' });

    const fileUrl = `/uploads/${req.file.filename}`;
    const media = new MediaAsset({ title, type, file_url: fileUrl });
    await media.save();
    // clear any analytics cache for this media (just in case)
    try { await redisClient.del(`media-analytics:${media._id}`); } catch (e) {}
    return res.status(201).json({ media });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /media/:id/stream-url -> returns expiring token
router.get('/:id/stream-url', auth, async (req, res) => {
  try {
    const media = await MediaAsset.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'not found' });

    const secret = process.env.STREAM_TOKEN_SECRET;
    const expiresIn = parseInt(process.env.STREAM_TOKEN_EXP_SECONDS || '600', 10);
    const token = jwt.sign({ mediaId: media._id }, secret, { expiresIn: `${expiresIn}s` });
    const protocol = req.protocol;
    const host = req.get('host');
    const streamUrl = `${protocol}://${host}/media/${media._id}/stream?token=${token}`;
    return res.json({ stream_url: streamUrl, expires_in_seconds: expiresIn });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /media/:id/stream -> stream file (supports range) BUT DOES NOT LOG VIEWS
router.get('/:id/stream', streamAuth, async (req, res) => {
  try {
    const tokenMediaId = req.streamPayload.mediaId;
    if (tokenMediaId !== req.params.id) return res.status(403).json({ error: 'token-media mismatch' });

    const media = await MediaAsset.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'media not found' });

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
        res.status(416).send('Requested range not satisfiable');
        return;
      }
      const chunkSize = (end - start) + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': media.type === 'video' ? 'video/mp4' : 'audio/mpeg'
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': media.type === 'video' ? 'video/mp4' : 'audio/mpeg'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// IMPORTANT: single canonical view logging endpoint (rate-limited)
router.post('/:id/view', auth, viewRateLimiter, async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await MediaAsset.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    // Only log once per request here
    const viewerIp = getClientIp(req);
    await MediaViewLog.create({ media_id: mediaId, viewed_by_ip: viewerIp });

    // Invalidate analytics cache for this media so next analytics call recalculates
    try { await redisClient.del(`media-analytics:${mediaId}`); } catch (e) {}

    console.log(`View logged for media ${mediaId} from ${viewerIp}`); // terminal visibility
    return res.json({ message: 'View logged' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET analytics - use redis caching
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await MediaAsset.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const cacheKey = `media-analytics:${mediaId}`;
    // check cache
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`Analytics cache HIT for ${mediaId}`);
        return res.json(JSON.parse(cached));
      }
    } catch (e) {
      // if redis fails don't break request
      console.warn('Redis get error', e);
    }

    console.log(`Analytics cache MISS for ${mediaId} — aggregating DB`);
    // aggregation pipeline
    const pipeline = [
      { $match: { media_id: media._id } },
      {
        $facet: {
          total_views: [{ $count: 'count' }],
          unique_ips: [{ $group: { _id: '$viewed_by_ip' } }, { $count: 'count' }],
          views_per_day: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ];

    const result = await MediaViewLog.aggregate(pipeline);
    const totalViews = result[0].total_views[0]?.count || 0;
    const uniqueIps = result[0].unique_ips[0]?.count || 0;
    const viewsPerDay = {};
    result[0].views_per_day.forEach(d => { viewsPerDay[d._id] = d.count; });

    const analytics = { total_views: totalViews, unique_ips: uniqueIps, views_per_day: viewsPerDay };

    // cache result for 5 minutes
    try {
      await redisClient.set(cacheKey, JSON.stringify(analytics), { EX: 300 });
      console.log(`Cached analytics for ${mediaId} (5m)`);
    } catch (e) {
      console.warn('Redis set error', e);
    }

    return res.json(analytics);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

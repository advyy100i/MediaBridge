require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static serving for uploaded files (only for development; in prod you typically let a CDN/S3 handle this)
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// routes
app.use('/auth', authRoutes);
app.use('/media', mediaRoutes);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server on ${PORT}`));
  })
  .catch(err => { console.error('mongo err', err); process.exit(1); });

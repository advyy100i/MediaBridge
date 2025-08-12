const jwt = require('jsonwebtoken');

const STREAM_SECRET = process.env.STREAM_TOKEN_SECRET;
const STREAM_EXP_SECONDS = parseInt(process.env.STREAM_TOKEN_EXP_SECONDS || '600', 10);

/**
 * Generates a short-lived streaming token for a given media ID.
 * @param {string} mediaId - The MongoDB ObjectId (or UUID) of the media asset.
 * @returns {string} JWT token
 */
function generateStreamToken(mediaId) {
  return jwt.sign(
    { mediaId },
    STREAM_SECRET,
    { expiresIn: STREAM_EXP_SECONDS + 's' }
  );
}

/**
 * Builds the full streaming URL given the request, media ID, and token.
 * @param {object} req - Express request (used for host/protocol).
 * @param {string} mediaId - The media asset ID.
 * @param {string} token - The JWT token.
 * @returns {string} Full streaming URL.
 */
function buildStreamUrl(req, mediaId, token) {
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}/media/${mediaId}/stream?token=${token}`;
}

module.exports = {
  generateStreamToken,
  buildStreamUrl
};

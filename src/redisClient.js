const redis = require('redis');

let client;

if (process.env.NODE_ENV === 'test') {
  // minimal mock so tests won't fail if they run
  client = {
    get: async () => null,
    set: async () => {},
    del: async () => {},
    on: () => {},
    connect: async () => {}
  };
} else {
  client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  (async () => {
    try {
      await client.connect();
      console.log('Redis connected');
    } catch (err) {
      console.error('Redis connect error', err);
    }
  })();
}

module.exports = client;

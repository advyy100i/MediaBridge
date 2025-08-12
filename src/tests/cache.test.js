const NodeCache = require('node-cache');
const cache = new NodeCache();

describe('Cache Layer', () => {
  it('should store and retrieve values', () => {
    cache.set('testKey', 'testValue', 100);
    expect(cache.get('testKey')).toBe('testValue');
  });

  it('should expire keys', (done) => {
    cache.set('expireKey', 'expireValue', 1); // 1 sec
    setTimeout(() => {
      expect(cache.get('expireKey')).toBeUndefined();
      done();
    }, 1100);
  });
});

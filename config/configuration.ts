export default () => ({
  app: {
    name: 'TEST',
    version: 9627,
    jwtSecret: process.env.JWT_SECRET ||'123456',
    jwtExpiration: '1h',
    jwtRefreshExpiration: '24h',
    corsOrigin: '*',
    corsMethods: 'GET,POST,PUT,DELETE,OPTIONS',
  },
  fsOutbound: {
    host: '0.0.0.0',
    port: process.env.FS_OUTBOUND_PORT || 8085,
  },
  fsInbound: {
    host: process.env.FS_INBOUND_HOST || '127.0.0.1',
    port: process.env.FS_INBOUND_PORT || 8021,
    password: process.env.FS_INBOUND_PASS || 'ClueCon',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASS || '123456',
  },
});

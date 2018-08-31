module.exports = {
  cors: {
    path: 'config/environment.js',
    preceding: 'ENV = {',
    bluePrint: (host) => (`    contentSecurityPolicy: {
      'style-src': "'self' 'unsafe-inline'",
      'connect-src': "'self' ${host}",
    },`)
  },
  host: {
    path: (fileName) => `app/adapters/${fileName || 'application'}.js`,
    preceding: 'export default',
    bluePrint: (url) => (`  host: '${url}',`),
  },
  namespace: {
    path: (fileName) => `app/adapters/${fileName || 'application'}.js`,
    preceding: 'host:\n',
    bluePrint: (namespace) => (`  namespace: '${namespace}',`),
  },
};

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:6001', // Your .NET backend URL
      changeOrigin: true,
      secure: false
    })
  );
};

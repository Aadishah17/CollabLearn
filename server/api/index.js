const app = require('../src/index');

const isHealthRequest = (url = '') => /^\/api\/health(?:[/?]|$)/.test(String(url || ''));

module.exports = async (req, res) => {
  const dbConnection = await app.initializeApp({ maxAttempts: 1 });

  if (!dbConnection && !isHealthRequest(req?.url)) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: false,
        message: 'Database unavailable'
      })
    );
    return;
  }

  return app(req, res);
};

// Vercel Serverless Function: Totals Endpoint
const { proxyRequest } = require('../lib/proxy');

module.exports = async (req, res) => {
    await proxyRequest('/totals', req, res);
};

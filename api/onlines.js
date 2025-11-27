// Vercel Serverless Function: Onlines Endpoint
const { proxyRequest } = require('../lib/proxy');

module.exports = async (req, res) => {
    await proxyRequest('/onlines', req, res);
};

// Vercel Serverless Function: Stores Endpoint
const { proxyRequest } = require('../lib/proxy');

module.exports = async (req, res) => {
    await proxyRequest('/stores', req, res);
};

// Vercel Serverless Function: Orders Endpoint
const { proxyRequest } = require('../lib/proxy');

module.exports = async (req, res) => {
    await proxyRequest('/orders', req, res);
};

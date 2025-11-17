// Vercel Serverless Function: Products Endpoint
const { proxyRequest } = require('../lib/proxy');

module.exports = async (req, res) => {
    await proxyRequest('/products', req, res);
};

// Vercel Serverless Function: Ping/Health Check Endpoint
const { proxyRequest } = require('../lib/proxy');

module.exports = async (req, res) => {
    await proxyRequest('/ping', req, res);
};

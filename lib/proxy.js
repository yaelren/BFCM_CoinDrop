// Shared Proxy Utility for Vercel Serverless Functions
// Forwards requests to Wix API with CORS headers

const https = require('https');

const TARGET_API = 'https://wix-bo.com/_api/bfcm-dashboard-serverless';

/**
 * Proxy handler for Vercel serverless functions
 * @param {string} endpoint - The API endpoint path (e.g., '/totals')
 * @param {object} req - Vercel request object
 * @param {object} res - Vercel response object
 */
async function proxyRequest(endpoint, req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        if (typeof res.status === 'function') {
            res.status(200).end();
        } else {
            res.writeHead(200);
            res.end();
        }
        return;
    }

    // Build target URL
    const queryString = new URL(req.url, `http://${req.headers.host}`).search;
    const targetUrl = `${TARGET_API}${endpoint}${queryString}`;

    console.log(`📡 Proxying: ${req.method} ${endpoint} -> ${targetUrl}`);

    return new Promise((resolve, reject) => {
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            let data = '';

            proxyRes.on('data', (chunk) => {
                data += chunk;
            });

            proxyRes.on('end', () => {
                // Support both Vercel (res.status().json()) and Node.js (res.writeHead/end)
                if (typeof res.status === 'function') {
                    // Vercel style
                    res.status(proxyRes.statusCode).json(JSON.parse(data));
                } else {
                    // Node.js style
                    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(data);
                }
                console.log(`✅ Response: ${proxyRes.statusCode} ${endpoint}`);
                resolve();
            });
        });

        proxyReq.on('error', (error) => {
            console.error(`❌ Proxy Error: ${error.message}`);
            const errorResponse = JSON.stringify({
                error: 'Proxy error',
                message: error.message
            });

            if (typeof res.status === 'function') {
                // Vercel style
                res.status(500).json(JSON.parse(errorResponse));
            } else {
                // Node.js style
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(errorResponse);
            }
            reject(error);
        });

        // Handle request body for POST requests
        if (req.method === 'POST' && req.body) {
            proxyReq.write(JSON.stringify(req.body));
        }

        proxyReq.end();
    });
}

module.exports = { proxyRequest };

// Simple CORS Proxy Server for BFCM Dashboard
// Forwards requests to Wix API and adds CORS headers

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;
const TARGET_API = 'https://wix-bo.com/_api/bfcm-dashboard-serverless';

const server = http.createServer((req, res) => {
    // Add CORS headers to all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parse the request URL
    const parsedUrl = url.parse(req.url, true);
    const endpoint = parsedUrl.pathname;

    // Build target URL
    const targetUrl = `${TARGET_API}${endpoint}${parsedUrl.search || ''}`;

    console.log(`📡 Proxying: ${req.method} ${endpoint} -> ${targetUrl}`);

    // Forward request to Wix API
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
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
            console.log(`✅ Response: ${proxyRes.statusCode} ${endpoint}`);
        });
    });

    proxyReq.on('error', (error) => {
        console.error(`❌ Proxy Error: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
    });

    // Handle request body for POST requests
    if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            proxyReq.write(body);
            proxyReq.end();
        });
    } else {
        proxyReq.end();
    }
});

server.listen(PORT, () => {
    console.log('🚀 CORS Proxy Server running');
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🎯 Forwarding to: ${TARGET_API}`);
    console.log(`\n✅ Update your dashboard to use: http://localhost:${PORT}\n`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try: killall node  OR  lsof -ti:${PORT} | xargs kill -9');
    } else {
        console.error('❌ Server Error:', error);
    }
});

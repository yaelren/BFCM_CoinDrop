#!/usr/bin/env node
// Internal Proxy Server for BFCM Dashboard
// Deploy this on a server inside Wix's network that has access to wix-bo.com

const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 8080;
const TARGET_API = process.env.TARGET_API || 'https://wix-bo.com/_api/bfcm-dashboard-serverless';
const API_KEY = process.env.API_KEY; // Optional authentication

// Allowed origins (add your Vercel domain)
const ALLOWED_ORIGINS = [
    'https://bfcm-2025.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
];

// Request logging
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}

// CORS check
function isOriginAllowed(origin) {
    return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
}

// Main server
const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    // Health check endpoint
    if (req.url === '/health' || req.url === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            target: TARGET_API
        }));
        return;
    }

    // CORS headers
    if (origin && isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (ALLOWED_ORIGINS.includes('*')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Optional API key authentication
    if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
        log(`Unauthorized request from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`, 'WARN');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    // Parse request
    const parsedUrl = url.parse(req.url, true);
    const endpoint = parsedUrl.pathname;
    const targetUrl = `${TARGET_API}${endpoint}${parsedUrl.search || ''}`;

    log(`${req.method} ${endpoint} -> ${targetUrl}`);

    // Proxy request
    const options = {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BFCM-Dashboard-Proxy/1.0'
        }
    };

    const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            // Forward response
            const headers = {
                'Content-Type': proxyRes.headers['content-type'] || 'application/json',
            };

            if (origin && isOriginAllowed(origin)) {
                headers['Access-Control-Allow-Origin'] = origin;
            }

            res.writeHead(proxyRes.statusCode, headers);
            res.end(data);

            log(`${proxyRes.statusCode} ${endpoint} (${data.length} bytes)`);
        });
    });

    proxyReq.on('error', (error) => {
        log(`Proxy error: ${error.message}`, 'ERROR');

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Proxy error',
            message: error.message
        }));
    });

    // Handle POST/PUT body
    if (req.method === 'POST' || req.method === 'PUT') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            if (body) {
                proxyReq.write(body);
            }
            proxyReq.end();
        });
    } else {
        proxyReq.end();
    }
});

// Error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        log(`Port ${PORT} is already in use`, 'ERROR');
        process.exit(1);
    } else {
        log(`Server error: ${error.message}`, 'ERROR');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully...', 'INFO');
    server.close(() => {
        log('Server closed', 'INFO');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully...', 'INFO');
    server.close(() => {
        log('Server closed', 'INFO');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    log('═══════════════════════════════════════════', 'INFO');
    log('🚀 BFCM Internal Proxy Server Started', 'INFO');
    log('═══════════════════════════════════════════', 'INFO');
    log(`📡 Listening on port: ${PORT}`, 'INFO');
    log(`🎯 Forwarding to: ${TARGET_API}`, 'INFO');
    log(`✅ Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`, 'INFO');
    log(`🔐 API Key auth: ${API_KEY ? 'ENABLED' : 'DISABLED'}`, 'INFO');
    log('═══════════════════════════════════════════', 'INFO');
    log(`Health check: http://localhost:${PORT}/health`, 'INFO');
    log('═══════════════════════════════════════════', 'INFO');
});

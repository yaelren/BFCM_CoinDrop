// Simple Development Server for Local Testing
// This mimics Vercel's serverless function routing

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// Import API handlers
const totals = require('./api/totals');
const orders = require('./api/orders');
const stores = require('./api/stores');
const products = require('./api/products');
const ping = require('./api/ping');

// Route map
const routes = {
    '/api/totals': totals,
    '/api/orders': orders,
    '/api/stores': stores,
    '/api/products': products,
    '/api/ping': ping
};

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`📡 ${req.method} ${pathname}`);

    // Check if it's an API route
    if (routes[pathname]) {
        try {
            await routes[pathname](req, res);
        } catch (error) {
            console.error(`❌ API Error: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
        return;
    }

    // Serve static files
    let filePath = '.' + pathname;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🚀 Development Server Running');
    console.log(`📡 Local: http://localhost:${PORT}`);
    console.log(`\n✅ API Endpoints:`);
    console.log(`   GET http://localhost:${PORT}/api/totals`);
    console.log(`   GET http://localhost:${PORT}/api/orders`);
    console.log(`   GET http://localhost:${PORT}/api/stores`);
    console.log(`   GET http://localhost:${PORT}/api/products`);
    console.log(`   GET http://localhost:${PORT}/api/ping`);
    console.log(`\n🎨 Open http://localhost:${PORT} in your browser\n`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try: killall node  OR  lsof -ti:3000 | xargs kill -9');
    } else {
        console.error('❌ Server Error:', error);
    }
});

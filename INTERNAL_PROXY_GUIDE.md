# Internal Proxy Deployment Guide

## 🎯 Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Users' Browser │────────▶│ Vercel (Static)  │────────▶│ Internal Proxy  │
│  (anywhere)     │         │ HTML/CSS/JS      │  HTTPS  │ (Wix Network)   │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └────────┬────────┘
                                                                   │
                                                                   │ VPN/Internal
                                                                   │ Network
                                                                   │
                                                          ┌────────▼────────┐
                                                          │                 │
                                                          │   Wix BFCM API  │
                                                          │  (wix-bo.com)   │
                                                          │                 │
                                                          └─────────────────┘
```

**Flow:**
1. User opens `https://bfcm-2025.vercel.app` → Loads static files from Vercel
2. Frontend calls `/api/totals` → Routes to internal proxy URL
3. Internal proxy (inside Wix network) → Calls Wix BFCM API
4. Response flows back: API → Proxy → Vercel → User

---

## 📦 Setup: Deploy Proxy Internally

### Step 1: Choose Internal Server Location

You need a server **inside Wix's network** that can reach `wix-bo.com/_api/bfcm-dashboard-serverless`:

**Options:**
- A. **Kubernetes/Docker** cluster at Wix
- B. **VM/EC2** instance with VPN to Wix network
- C. **Existing internal server** (if available)
- D. **Local developer machine** (for testing only)

---

### Step 2: Deploy Proxy Code

#### Option A: Use Simple Proxy Server

Create `internal-proxy-server.js`:

```javascript
// Simple CORS Proxy for Internal Wix Network
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 8080;
const TARGET_API = 'https://wix-bo.com/_api/bfcm-dashboard-serverless';

// Allowed origins (your Vercel domain)
const ALLOWED_ORIGINS = [
    'https://bfcm-2025.vercel.app',
    'http://localhost:3000', // For local dev
];

const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    // CORS for allowed origins only
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const endpoint = parsedUrl.pathname;
    const targetUrl = `${TARGET_API}${endpoint}${parsedUrl.search || ''}`;

    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${endpoint}`);

    const options = {
        method: req.method,
        headers: { 'Content-Type': 'application/json' }
    };

    const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => { data += chunk; });
        proxyRes.on('end', () => {
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin || '*'
            });
            res.end(data);
            console.log(`✅ ${proxyRes.statusCode} ${endpoint}`);
        });
    });

    proxyReq.on('error', (error) => {
        console.error(`❌ Error: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    });

    if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
            proxyReq.write(body);
            proxyReq.end();
        });
    } else {
        proxyReq.end();
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Internal Proxy Running on port ${PORT}`);
    console.log(`🎯 Forwarding to: ${TARGET_API}`);
    console.log(`✅ Allowed origins:`, ALLOWED_ORIGINS);
});
```

#### Deploy Commands:

```bash
# On internal server
cd /opt/bfcm-proxy  # or your chosen directory
node internal-proxy-server.js

# Or with PM2 (recommended for production)
npm install -g pm2
pm2 start internal-proxy-server.js --name bfcm-proxy
pm2 save
pm2 startup
```

---

### Step 3: Expose Proxy with HTTPS

You need an HTTPS URL for the proxy. Options:

#### A. **Internal Load Balancer** (Recommended)
If Wix has internal LB/ingress:
```
https://bfcm-proxy.wix-internal.com:8080
```

#### B. **Nginx Reverse Proxy**
```nginx
server {
    listen 443 ssl;
    server_name bfcm-proxy.wix-internal.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### C. **Cloudflare Tunnel** (If internal DNS not available)
```bash
cloudflared tunnel --url http://localhost:8080
# Gives you: https://random-name.trycloudflare.com
```

---

### Step 4: Update Vercel Frontend

Update frontend to use internal proxy URL:

#### Option A: Environment Variable (Best)

In Vercel dashboard:
```
Settings → Environment Variables
API_BASE_URL = https://bfcm-proxy.wix-internal.com
```

Update `js/api.js`:
```javascript
// Read from environment or fall back to /api
const API_BASE_URL = typeof process !== 'undefined' && process.env.API_BASE_URL
    ? process.env.API_BASE_URL
    : '/api';
```

**Note:** For static sites, you need build-time env vars. Update with:
```javascript
// js/api.js
const API_BASE_URL = 'https://bfcm-proxy.wix-internal.com';
```

Then redeploy Vercel.

---

## 🐳 Docker Deployment (Recommended)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy proxy server
COPY internal-proxy-server.js .

EXPOSE 8080

CMD ["node", "internal-proxy-server.js"]
```

### Deploy to Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bfcm-proxy
  namespace: bfcm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bfcm-proxy
  template:
    metadata:
      labels:
        app: bfcm-proxy
    spec:
      containers:
      - name: proxy
        image: wix-registry/bfcm-proxy:latest
        ports:
        - containerPort: 8080
        env:
        - name: PORT
          value: "8080"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: bfcm-proxy-service
  namespace: bfcm
spec:
  selector:
    app: bfcm-proxy
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f deployment.yaml
kubectl get svc bfcm-proxy-service  # Get external IP
```

---

## 🔐 Security Considerations

### 1. **Restrict Origins**
Only allow your Vercel domain:
```javascript
const ALLOWED_ORIGINS = ['https://bfcm-2025.vercel.app'];
```

### 2. **Add Authentication** (Optional)
```javascript
const API_KEY = process.env.API_KEY;

if (req.headers['x-api-key'] !== API_KEY) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
}
```

Update frontend:
```javascript
fetch(`${API_BASE_URL}/totals`, {
    headers: { 'x-api-key': 'your-secret-key' }
});
```

### 3. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100 // limit each IP to 100 requests per minute
});
```

---

## 📊 Monitoring

### Health Check Endpoint

Add to proxy server:
```javascript
if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString()
    }));
    return;
}
```

### Logging
```javascript
// Log to file or monitoring service
const fs = require('fs');
const logStream = fs.createWriteStream('/var/log/bfcm-proxy.log', { flags: 'a' });

console.log = (msg) => {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ${msg}\n`);
    process.stdout.write(`[${timestamp}] ${msg}\n`);
};
```

---

## 🧪 Testing

### Test Internal Proxy
```bash
# From internal network
curl https://bfcm-proxy.wix-internal.com/ping

# Should return: pong
```

### Test Full Flow
```bash
# From Vercel
curl https://bfcm-2025.vercel.app/

# Open browser console, should see API calls to internal proxy
```

---

## 📈 Cost & Maintenance

### Resources Needed:
- **Compute:** 0.1 CPU, 128MB RAM (minimal)
- **Network:** ~1GB/month (for dashboard traffic)
- **Storage:** Negligible

### Maintenance:
- ✅ **Auto-restart:** Use PM2 or systemd
- ✅ **Monitoring:** Add to existing monitoring stack
- ✅ **Updates:** Minimal (proxy code is stable)

---

## 🎯 Summary

**What you'll have:**
1. Static files on Vercel (fast, CDN-distributed)
2. Proxy server inside Wix network (has API access)
3. Frontend → Internal Proxy → Wix API

**Advantages:**
- ✅ Works with existing network restrictions
- ✅ No backend policy changes
- ✅ Production-ready
- ✅ Easy to monitor and maintain

**Trade-offs:**
- 🔧 Extra infrastructure to manage
- 🐌 Slight latency (extra hop through proxy)
- 💰 Minimal cost (tiny server)

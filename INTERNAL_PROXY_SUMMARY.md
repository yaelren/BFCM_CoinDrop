# Internal Proxy - Quick Summary

## 🎯 The Simple Explanation

**Problem:** Vercel can't reach Wix's internal API
**Solution:** Put a proxy server inside Wix's network

```
Internet Users → Vercel (Static) → Internal Proxy → Wix API
               (HTML/CSS/JS)      (Inside Wix Net)  (Restricted)
```

---

## 📦 What You Need to Deploy

### 1. **The Proxy Server File**
→ [internal-proxy-server.js](internal-proxy-server.js)

This is a ~150 line Node.js server that:
- Receives requests from Vercel
- Forwards them to Wix API
- Sends responses back

### 2. **A Server Inside Wix Network**
You need a machine/container that can reach `wix-bo.com`

Options (pick one):
- ☁️ **Kubernetes pod** in Wix cluster
- 🖥️ **VM/EC2** with VPN to Wix
- 📦 **Docker container** on internal server
- 💻 **Developer machine** (testing only)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Copy Files to Internal Server
```bash
# On your internal server
scp internal-proxy-server.js user@internal-server:~/bfcm-proxy/
```

### Step 2: Run the Proxy
```bash
# SSH into internal server
ssh user@internal-server

# Run proxy
cd ~/bfcm-proxy
node internal-proxy-server.js

# Should see:
# 🚀 BFCM Internal Proxy Server Started
# 📡 Listening on port: 8080
```

### Step 3: Expose with HTTPS
Get an HTTPS URL (choose one):

**Option A: Nginx**
```nginx
server {
    listen 443 ssl;
    server_name bfcm-proxy.wix-internal.com;

    location / {
        proxy_pass http://localhost:8080;
    }
}
```

**Option B: Cloudflare Tunnel** (easiest)
```bash
cloudflared tunnel --url http://localhost:8080
# Gives you: https://xyz.trycloudflare.com
```

**Option C: Load Balancer**
Point your internal LB to `localhost:8080`

---

## 🔧 Update Vercel Frontend

Once proxy is running at (example) `https://bfcm-proxy.wix-internal.com`:

Update [js/api.js:7](js/api.js#L7):
```javascript
const API_BASE_URL = 'https://bfcm-proxy.wix-internal.com';
```

Redeploy Vercel:
```bash
git add js/api.js
git commit -m "Update API to use internal proxy"
git push
npm run deploy
```

---

## ✅ Testing

### Test 1: Proxy Health
```bash
curl https://bfcm-proxy.wix-internal.com/health
# Should return: {"status":"healthy",...}
```

### Test 2: API Endpoint
```bash
curl https://bfcm-proxy.wix-internal.com/ping
# Should return: pong
```

### Test 3: Frontend
Open https://bfcm-2025.vercel.app
- Should load without 504 errors
- Check browser console for API calls

---

## 📊 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         INTERNET                              │
│                                                               │
│  ┌─────────────┐                                             │
│  │   Users     │                                             │
│  │  Browser    │                                             │
│  └──────┬──────┘                                             │
│         │ HTTPS                                              │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  Vercel CDN (Static Files)                          │    │
│  │  - index.html, led.html                             │    │
│  │  - js/api.js, js/main.js                            │    │
│  │  - css/, assets/                                    │    │
│  │                                                      │    │
│  └──────┬───────────────────────────────────────────────┘    │
│         │ HTTPS                                              │
│         │ (API calls to internal proxy)                     │
└─────────┼────────────────────────────────────────────────────┘
          │
          │ Firewall/VPN
          │
┌─────────▼────────────────────────────────────────────────────┐
│                    WIX INTERNAL NETWORK                       │
│                                                               │
│  ┌────────────────────────────────────────────┐              │
│  │                                            │              │
│  │  Internal Proxy (internal-proxy-server.js) │              │
│  │  - Port 8080                               │              │
│  │  - CORS headers                            │              │
│  │  - Request forwarding                      │              │
│  │                                            │              │
│  └───────────────┬────────────────────────────┘              │
│                  │ HTTPS                                     │
│                  │                                           │
│  ┌───────────────▼────────────────────────────┐              │
│  │                                            │              │
│  │  Wix BFCM API                              │              │
│  │  wix-bo.com/_api/bfcm-dashboard-serverless│              │
│  │  - /totals, /orders, /stores, /products   │              │
│  │                                            │              │
│  └────────────────────────────────────────────┘              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost & Resources

**Compute:**
- CPU: 0.1 core (100m in k8s)
- Memory: 128-256 MB
- Storage: Negligible

**Network:**
- Bandwidth: ~1-5 GB/month
- Latency: +10-50ms (extra hop)

**Cost:**
- Free (if using existing infrastructure)
- $5-10/month (if new VM needed)

---

## 🔐 Security Notes

1. **Restrict origins** - Only allow your Vercel domain
2. **Add API key** (optional) - Set `API_KEY` env variable
3. **Monitor logs** - Watch for suspicious activity
4. **Rate limit** (optional) - Prevent abuse

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| [internal-proxy-server.js](internal-proxy-server.js) | Main proxy server code |
| [Dockerfile.proxy](Dockerfile.proxy) | Docker container build |
| [docker-compose.proxy.yml](docker-compose.proxy.yml) | Docker Compose config |
| [deploy-internal-proxy.sh](deploy-internal-proxy.sh) | Automated deployment script |
| [INTERNAL_PROXY_GUIDE.md](INTERNAL_PROXY_GUIDE.md) | Detailed deployment guide |

---

## 🎯 TL;DR

1. Deploy `internal-proxy-server.js` to a server inside Wix network
2. Expose it with HTTPS (nginx/cloudflare/LB)
3. Update Vercel frontend to use proxy URL
4. Done! ✅

# How to Expose Your Internal Proxy

## 🎯 The Problem

You run `node internal-proxy-server.js` on a server → it listens on `localhost:8080`

**But:** Vercel can't reach `localhost` on your server!

You need a **public URL** that routes to your proxy.

---

## ✅ **Solution Options (Easiest First)**

### **Option 1: Cloudflare Tunnel** (5 minutes, FREE)

This is the **easiest** way to expose your proxy with HTTPS.

#### Step 1: Install Cloudflare Tunnel
```bash
# On your internal server (where proxy runs)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### Step 2: Run Proxy + Tunnel
```bash
# Terminal 1: Start your proxy
node internal-proxy-server.js

# Terminal 2: Create tunnel
cloudflared tunnel --url http://localhost:8080
```

#### Step 3: Get Your URL
You'll see:
```
Your quick Tunnel has been created! Visit it at:
https://abc-def-ghi.trycloudflare.com
```

**That's your proxy URL!** Copy it.

#### Step 4: Update Vercel
Update `js/api.js`:
```javascript
const API_BASE_URL = 'https://abc-def-ghi.trycloudflare.com';
```

✅ **Pros:**
- FREE
- Automatic HTTPS
- 5 minute setup
- Works from anywhere

❌ **Cons:**
- URL changes each time you restart tunnel
- Temporary solution

---

### **Option 2: ngrok** (Similar to Cloudflare)

Another popular tunneling service.

#### Setup:
```bash
# Install ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-*.tgz

# Run proxy
node internal-proxy-server.js

# Create tunnel
./ngrok http 8080
```

You'll get:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:8080
```

Use `https://abc123.ngrok.io` as your API_BASE_URL.

✅ **Pros:**
- FREE tier available
- Easy setup
- Web interface to inspect requests

❌ **Cons:**
- URL changes on free tier
- Rate limits on free tier

---

### **Option 3: Wix Internal DNS** (Production, Permanent)

If your server is already in Wix's network, register an internal DNS name.

#### Setup:
1. Ask Wix DevOps to create DNS record:
   ```
   bfcm-proxy.wix-internal.com → your-server-ip:8080
   ```

2. Configure nginx/load balancer for HTTPS:
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

3. Use `https://bfcm-proxy.wix-internal.com` as your URL.

✅ **Pros:**
- Permanent URL
- Production-ready
- No third-party dependencies

❌ **Cons:**
- Requires DevOps coordination
- More setup time

---

### **Option 4: Tailscale VPN** (If Vercel Can't Reach Internal)

If your proxy is on a truly private network, use Tailscale to create a VPN.

#### Setup:
```bash
# On proxy server
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Get your Tailscale IP
tailscale ip -4
# Example: 100.64.1.5
```

Your proxy is now at: `http://100.64.1.5:8080`

**Problem:** Vercel can't join your Tailscale network.

**Solution:** Use Cloudflare/ngrok tunnel **from** your Tailscale machine.

---

### **Option 5: Kubernetes Ingress** (If Using K8s)

If your proxy runs in Kubernetes:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bfcm-proxy-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  rules:
  - host: bfcm-proxy.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bfcm-proxy-service
            port:
              number: 80
  tls:
  - hosts:
    - bfcm-proxy.your-domain.com
    secretName: bfcm-proxy-tls
```

This creates: `https://bfcm-proxy.your-domain.com`

---

## 🧪 **Testing Your Exposed Proxy**

Once you have a URL, test it:

### Test 1: Health Check
```bash
curl https://your-proxy-url/health
```

Should return:
```json
{"status":"healthy","timestamp":"2025-11-17T..."}
```

### Test 2: API Endpoint
```bash
curl https://your-proxy-url/ping
```

Should return:
```
pong
```

### Test 3: From Vercel
Update `js/api.js`:
```javascript
const API_BASE_URL = 'https://your-proxy-url';
```

Deploy to Vercel:
```bash
git add js/api.js
git commit -m "Update API URL to internal proxy"
git push
npm run deploy
```

Open `https://bfcm-2025.vercel.app` → Should work! ✅

---

## 📊 **Quick Comparison**

| Method | Setup Time | Cost | Permanence | Best For |
|--------|------------|------|------------|----------|
| **Cloudflare Tunnel** | 5 min | Free | Temporary | Quick testing |
| **ngrok** | 5 min | Free/Paid | Temporary | Development |
| **Wix Internal DNS** | 1-2 days | Free | Permanent | Production |
| **Tailscale** | 10 min | Free | Permanent | Private networks |
| **K8s Ingress** | 30 min | Included | Permanent | K8s deployments |

---

## 🎯 **Recommended Approach**

### For Testing (Today):
1. Use **Cloudflare Tunnel** or **ngrok**
2. Get URL in 5 minutes
3. Test entire flow

### For Production (Later):
1. Talk to DevOps about **internal DNS**
2. Get permanent `bfcm-proxy.wix-internal.com` URL
3. Update Vercel with permanent URL

---

## 🚀 **Step-by-Step Example (Cloudflare)**

Let me walk you through the **fastest** way:

```bash
# 1. SSH to your internal server
ssh user@your-server

# 2. Start proxy in background
node internal-proxy-server.js &

# 3. Install cloudflared (one-time)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# 4. Create tunnel
cloudflared tunnel --url http://localhost:8080
```

**Output:**
```
2025-11-17T16:00:00Z INF +--------------------------------------------------------------------------------------------+
2025-11-17T16:00:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
2025-11-17T16:00:00Z INF |  https://fancy-zebra-1234.trycloudflare.com                                                |
2025-11-17T16:00:00Z INF +--------------------------------------------------------------------------------------------+
```

**Copy that URL** → Update `js/api.js` → Deploy → Done! 🎉

---

## 💡 **Pro Tips**

1. **Keep tunnel running:** Use `screen` or `tmux` so tunnel doesn't die when you disconnect
   ```bash
   screen -S cloudflare
   cloudflared tunnel --url http://localhost:8080
   # Press Ctrl+A, then D to detach
   ```

2. **Persistent tunnel:** Cloudflare offers named tunnels that keep same URL
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create bfcm-proxy
   cloudflared tunnel route dns bfcm-proxy bfcm-proxy.yourdomain.com
   cloudflared tunnel run bfcm-proxy
   ```

3. **Monitor logs:** Check both proxy and tunnel logs for debugging

---

## ❓ **Still Confused?**

The simplest mental model:

```
Your Proxy          Tunnel Service         Public Internet
(localhost:8080) ←→ (cloudflare/ngrok) ←→ (https://xyz.com)
                    ↑
                    This creates a public URL
```

**Without tunnel:** Only accessible from your server
**With tunnel:** Accessible from anywhere (including Vercel)

---

Need help with a specific option? Let me know! 🚀

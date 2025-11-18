# Production Deployment - Permanent Proxy Setup

## ❌ The Problem with Temporary Tunnels

**Cloudflare Tunnel / ngrok free tier:**
- URL changes each restart
- Requires terminal to stay open
- Not production-ready
- Dies when SSH session closes

**You need:** A permanent server with a permanent URL.

---

## ✅ **Production-Ready Options**

### **Option 1: Wix Internal Server** (RECOMMENDED)

Deploy the proxy on existing Wix infrastructure.

#### Where to Deploy:

**A. Kubernetes (Best)**
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bfcm-proxy
  namespace: bfcm-dashboard
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
        image: node:18-alpine
        command: ["node", "internal-proxy-server.js"]
        ports:
        - containerPort: 8080
        env:
        - name: PORT
          value: "8080"
        - name: TARGET_API
          value: "https://wix-bo.com/_api/bfcm-dashboard-serverless"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: bfcm-proxy
  namespace: bfcm-dashboard
spec:
  type: LoadBalancer
  selector:
    app: bfcm-proxy
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bfcm-proxy
  namespace: bfcm-dashboard
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - bfcm-proxy.wix-internal.com
    secretName: bfcm-proxy-tls
  rules:
  - host: bfcm-proxy.wix-internal.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bfcm-proxy
            port:
              number: 80
```

**Deploy:**
```bash
kubectl apply -f k8s-deployment.yaml
kubectl get ingress -n bfcm-dashboard
# Get URL: https://bfcm-proxy.wix-internal.com
```

**Result:** Permanent URL, auto-scaling, health checks, restarts on failure.

---

**B. Docker on VM**
```bash
# On a Wix VM with internal network access
docker run -d \
  --name bfcm-proxy \
  --restart always \
  -p 8080:8080 \
  -e PORT=8080 \
  -e TARGET_API=https://wix-bo.com/_api/bfcm-dashboard-serverless \
  node:18-alpine \
  sh -c "echo '$(cat internal-proxy-server.js)' > server.js && node server.js"
```

Then expose with nginx:
```nginx
# /etc/nginx/sites-available/bfcm-proxy
server {
    listen 443 ssl http2;
    server_name bfcm-proxy.wix-internal.com;

    ssl_certificate /etc/ssl/certs/wix-internal.crt;
    ssl_certificate_key /etc/ssl/private/wix-internal.key;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

**C. Systemd Service (Simple VM)**
```ini
# /etc/systemd/system/bfcm-proxy.service
[Unit]
Description=BFCM Dashboard Proxy
After=network.target

[Service]
Type=simple
User=bfcm
WorkingDirectory=/opt/bfcm-proxy
Environment="PORT=8080"
Environment="TARGET_API=https://wix-bo.com/_api/bfcm-dashboard-serverless"
ExecStart=/usr/bin/node /opt/bfcm-proxy/internal-proxy-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Setup:**
```bash
# Copy files
sudo mkdir -p /opt/bfcm-proxy
sudo cp internal-proxy-server.js /opt/bfcm-proxy/

# Create user
sudo useradd -r -s /bin/false bfcm

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable bfcm-proxy
sudo systemctl start bfcm-proxy
sudo systemctl status bfcm-proxy
```

**Result:** Auto-starts on boot, restarts on failure, runs as daemon.

---

### **Option 2: Cloud VM with VPN to Wix**

If you can't use Wix infrastructure, deploy to a cloud VM that connects via VPN.

#### Providers:
- **AWS EC2** + Site-to-Site VPN
- **Google Cloud VM** + Cloud VPN
- **Azure VM** + VPN Gateway

#### Setup Example (AWS):
```bash
# 1. Create EC2 instance in VPC with VPN to Wix network
# 2. Deploy proxy
ssh ec2-user@your-ec2-instance
git clone <your-repo>
cd BFCM_CoinDrop
node internal-proxy-server.js

# 3. Setup systemd service (as above)
# 4. Configure security group to allow port 8080
# 5. Use AWS Certificate Manager for HTTPS
# 6. Use CloudFront or ALB for permanent URL
```

**Result:** `https://bfcm-proxy.your-company.com`

**Cost:** ~$10-20/month

---

### **Option 3: Cloudflare Tunnel (Named/Permanent)**

You mentioned tunnels are temporary, but **named tunnels** are permanent!

#### Setup Permanent Cloudflare Tunnel:
```bash
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create named tunnel (permanent)
cloudflared tunnel create bfcm-proxy

# Output: Tunnel credentials written to /root/.cloudflared/<UUID>.json
# Tunnel ID: abc-123-def

# 3. Route DNS to tunnel
cloudflared tunnel route dns bfcm-proxy bfcm-proxy.your-domain.com

# 4. Create config
cat > ~/.cloudflared/config.yml <<EOF
tunnel: abc-123-def
credentials-file: /root/.cloudflared/abc-123-def.json

ingress:
  - hostname: bfcm-proxy.your-domain.com
    service: http://localhost:8080
  - service: http_status:404
EOF

# 5. Install as service
cloudflared service install

# 6. Start tunnel
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

**Result:**
- Permanent URL: `https://bfcm-proxy.your-domain.com`
- Auto-restarts
- FREE for up to 50 users

---

### **Option 4: Railway.app / Render.com**

Deploy to a PaaS that stays online 24/7.

#### Railway (Easiest):
```bash
# 1. Install Railway CLI
npm i -g railway

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Add start script to package.json
{
  "scripts": {
    "start": "node internal-proxy-server.js"
  }
}

# 5. Deploy
railway up
```

**Result:** Permanent URL like `https://bfcm-proxy.up.railway.app`

**Cost:** $5/month

**Problem:** Railway can't reach Wix internal API (same issue as Vercel).

**Solution:** Only works if Wix API is publicly accessible or you use VPN.

---

## 🎯 **Recommended Architecture**

For **production** at Wix:

```
┌─────────────────────────────────────────────────────┐
│                    INTERNET                          │
│                                                      │
│  Users → Vercel (Static Files)                      │
│            ↓                                         │
│            https://bfcm-proxy.wix-internal.com       │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ (Wix Internal DNS)
                       │
┌──────────────────────▼──────────────────────────────┐
│              WIX INTERNAL NETWORK                    │
│                                                      │
│  ┌─────────────────────────────────────────┐        │
│  │  Kubernetes Cluster / Load Balancer     │        │
│  │  bfcm-proxy.wix-internal.com           │        │
│  │                                         │        │
│  │  ┌───────────┐  ┌───────────┐          │        │
│  │  │ Proxy     │  │ Proxy     │          │        │
│  │  │ Pod 1     │  │ Pod 2     │          │        │
│  │  └───────────┘  └───────────┘          │        │
│  │                                         │        │
│  └─────────────────────────────────────────┘        │
│                       ↓                              │
│  ┌─────────────────────────────────────────┐        │
│  │  Wix BFCM API                           │        │
│  │  wix-bo.com/_api/bfcm-dashboard...     │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Why this works:**
1. ✅ Permanent URL (DNS + cert managed by Wix)
2. ✅ Auto-scaling (K8s handles load)
3. ✅ Health checks (restarts on failure)
4. ✅ Monitoring (integrated with Wix's stack)
5. ✅ Zero external dependencies

---

## 📋 **What You Need from DevOps**

To make this permanent, ask your Wix DevOps team for:

### 1. **Deployment Location**
```
"Can we deploy a small Node.js proxy to:
 - Kubernetes cluster (preferred)
 - Existing VM with Docker
 - New dedicated VM"
```

### 2. **Internal DNS Entry**
```
"Can we get a DNS record:
 bfcm-proxy.wix-internal.com → <deployment-location>

 With SSL/TLS certificate"
```

### 3. **Network Access**
```
"The proxy needs to reach:
 https://wix-bo.com/_api/bfcm-dashboard-serverless

 And be reachable from:
 - Vercel IP ranges (public internet)
 - Internal developers (for testing)"
```

### 4. **Resources Needed**
```
CPU: 0.1-0.2 cores
Memory: 128-256 MB
Network: ~1-5 GB/month
Cost: Negligible (~$0.50/month if new VM)
```

---

## ⚡ **Quick Decision Matrix**

| Your Situation | Best Option |
|----------------|-------------|
| Have access to Wix K8s | **Deploy to Kubernetes** |
| Have access to Wix VMs | **Docker + systemd** |
| DevOps can help | **Ask for K8s deployment** |
| Need it working TODAY | **Cloudflare named tunnel** |
| No Wix access yet | **Wait for DevOps approval** |

---

## 🚀 **Fastest Production Path**

### Phase 1: Testing (This Week)
```bash
# Temporary testing with Cloudflare
cloudflared tunnel --url http://localhost:8080
# Use the temp URL to validate everything works
```

### Phase 2: Production (Next Week)
```bash
# Submit request to DevOps:
"Please deploy internal-proxy-server.js to K8s
 with DNS: bfcm-proxy.wix-internal.com"

# They'll give you permanent URL
# Update Vercel with permanent URL
# Done! ✅
```

---

## 💡 **Key Insight**

The proxy itself is **tiny** (150 lines, 128MB RAM).

The real question is: **Where should it live?**

- If Wix has K8s/Docker → Use that (best)
- If not → Create VM + systemd (simple)
- If can't wait → Cloudflare named tunnel (quick)

Talk to your DevOps team - this is a **standard microservice deployment**. They likely have a template for this!

---

Need help drafting the DevOps request? Let me know! 🚀

# DevOps Deployment Request - BFCM Dashboard Proxy

## 📋 Summary

Request to deploy a lightweight Node.js proxy service for the BFCM Dashboard that enables the frontend (hosted on Vercel) to access internal Wix APIs.

---

## 🎯 Business Context

**Project:** BFCM 2025 Real-time Dashboard
**Purpose:** Monitor Black Friday Cyber Monday orders in real-time
**Frontend:** Deployed to Vercel (public CDN)
**Backend:** Internal Wix API (`wix-bo.com/_api/bfcm-dashboard-serverless`)

**Problem:** Vercel cannot reach internal Wix API due to network restrictions.
**Solution:** Deploy lightweight proxy inside Wix network to forward API calls.

---

## 🏗️ What We Need

### 1. Deployment Target
**Preferred:** Kubernetes cluster (wix-k8s or similar)
**Alternative:** Docker on existing VM
**Fallback:** New VM with Docker/systemd

### 2. DNS Entry
**Hostname:** `bfcm-proxy.wix-internal.com` (or similar)
**Target:** The deployed proxy service
**Protocol:** HTTPS with valid SSL certificate
**Accessibility:** Public internet (Vercel IP ranges) + internal developers

### 3. Network Access
**Outbound:** Proxy needs to reach `https://wix-bo.com/_api/bfcm-dashboard-serverless`
**Inbound:** Accept HTTPS from Vercel (public internet) and internal network

---

## 📦 Service Specifications

### Resource Requirements
```yaml
CPU: 100-200m (0.1-0.2 cores)
Memory: 128-256 MB
Storage: Negligible (~10MB)
Network: ~1-5 GB/month (low traffic)
```

### Application Details
- **Runtime:** Node.js 18+
- **Port:** 8080 (configurable)
- **Health Check:** `/health` endpoint
- **Restart Policy:** Always restart on failure
- **Replicas:** 2 (recommended for HA)

### Code Repository
```
GitHub: github.com/yaelren/BFCM_CoinDrop
File: internal-proxy-server.js
Size: 150 lines, self-contained
Dependencies: None (uses Node.js stdlib only)
```

---

## 🐳 Deployment Options

### Option A: Kubernetes (Preferred)
```yaml
# Deployment manifest provided in repo:
# k8s-deployment.yaml

Namespace: bfcm-dashboard (or your choice)
Service Type: LoadBalancer
Ingress: Yes, with cert-manager for TLS
```

**Benefits:**
- Auto-scaling if needed
- Health checks & auto-restart
- Integrated monitoring
- Standard Wix deployment

### Option B: Docker on VM
```bash
# Simple Docker run command:
docker run -d \
  --name bfcm-proxy \
  --restart always \
  -p 8080:8080 \
  -e PORT=8080 \
  node:18-alpine \
  sh -c "node /app/internal-proxy-server.js"
```

Then expose via nginx/ALB with HTTPS.

### Option C: Systemd Service
```bash
# For simple VM deployment
# Systemd unit file provided in repo
# deploy-internal-proxy.sh automates setup
```

---

## 🔐 Security Considerations

### CORS Protection
- Proxy only accepts requests from `https://bfcm-2025.vercel.app`
- Optional API key authentication available
- All other origins rejected

### Network
- No public database access needed
- Only forwards to internal Wix API
- Stateless (no data stored)

### Monitoring
- Health check endpoint: `/health`
- Logs to stdout (standard logging)
- Compatible with existing log aggregation

---

## 📊 Traffic Expectations

**Users:** ~10-50 concurrent (dashboard viewers)
**Requests:** ~100-500 req/min during BFCM peak
**Bandwidth:** < 1 GB/day
**Availability:** Business hours during BFCM (Nov 24-27, 2025)

**SLA:** Standard (99% uptime sufficient for monitoring dashboard)

---

## 🧪 Testing Plan

### Pre-Production
1. Deploy to staging/dev environment
2. Test with staging Vercel deployment
3. Verify API connectivity
4. Load test with expected traffic

### Production
1. Deploy to production
2. Update Vercel environment variable
3. Monitor for 24 hours
4. Full rollout

### Rollback
If issues occur, revert Vercel to use mock data (frontend has fallback).

---

## 📅 Timeline

**Urgency:** Medium (BFCM is Nov 24-27, 2025)
**Ideal Deployment:** 1-2 weeks before BFCM (Nov 10-15)
**Latest:** Nov 20, 2025

---

## 👥 Team Contacts

**Requester:** [Your Name] ([your.email@wix.com](mailto:your.email@wix.com))
**Project Manager:** [PM Name if applicable]
**Tech Lead:** [Tech Lead if applicable]

---

## 📁 Provided Resources

We've prepared complete deployment files:

1. ✅ **internal-proxy-server.js** - Main proxy code (production-ready)
2. ✅ **Dockerfile.proxy** - Docker build configuration
3. ✅ **docker-compose.proxy.yml** - Docker Compose setup
4. ✅ **k8s-deployment.yaml** - Kubernetes deployment manifest
5. ✅ **deploy-internal-proxy.sh** - Automated deployment script
6. ✅ **PRODUCTION_DEPLOYMENT.md** - Detailed deployment guide

**Repository:** [github.com/yaelren/BFCM_CoinDrop](https://github.com/yaelren/BFCM_CoinDrop)

---

## ❓ Questions We Can Answer

1. Why not deploy the entire frontend internally?
   - Vercel provides CDN, auto-scaling, and better performance globally
   - Only the API proxy needs internal network access

2. Why not allowlist Vercel IPs on the API?
   - Can do this if preferred! (See DEPLOYMENT_OPTIONS.md)
   - Proxy gives us more control and monitoring

3. Can we use existing infrastructure?
   - Yes! Proxy is tiny and can share resources
   - Standard Node.js microservice pattern

4. What if the proxy goes down?
   - Frontend has graceful error handling
   - Users see "API unavailable" message
   - No data loss (stateless service)

---

## ✅ Acceptance Criteria

- [ ] Proxy deployed and accessible at `https://bfcm-proxy.wix-internal.com`
- [ ] Health check returns 200 OK
- [ ] Can reach Wix API from proxy
- [ ] Vercel frontend can call proxy successfully
- [ ] HTTPS with valid certificate
- [ ] Service auto-restarts on failure
- [ ] Basic monitoring/logging in place

---

## 🚀 Next Steps

1. **Review this request** - Any questions or concerns?
2. **Choose deployment option** - K8s / Docker / VM?
3. **Assign ownership** - Which team will manage?
4. **Schedule deployment** - Preferred date/time?
5. **Provide DNS/URL** - We'll update Vercel accordingly

---

Thank you for your support in making BFCM 2025 dashboard a success! 🎉

Please let me know if you need any additional information or clarification.

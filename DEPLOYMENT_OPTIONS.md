# Deployment Options - Network Restriction Issue

## 🔒 Problem

The Wix API (`https://wix-bo.com/_api/bfcm-dashboard-serverless`) appears to have network restrictions that block Vercel's cloud IPs, resulting in 504 Gateway Timeout errors.

**Evidence:**
- ✅ Local development works (with VPN/internal network)
- ❌ Vercel deployment times out after 10s
- The API likely requires VPN or internal Wix network access

---

## ✅ **Solution 1: Allowlist Vercel IPs (Recommended)**

### What to Do:
Ask your backend team to allowlist Vercel's IP ranges for the BFCM API endpoint.

### Vercel IP Ranges:
See: https://vercel.com/docs/deployments/ip-addresses

### Benefits:
- ✅ Cleanest solution
- ✅ No extra infrastructure
- ✅ Production-ready
- ✅ Fast response times

### Drawbacks:
- ⏳ Requires backend team coordination
- 🔐 May not be allowed for security reasons

---

## ✅ **Solution 2: Deploy Proxy to Internal Network**

### What to Do:
Deploy the proxy server to a machine/server **inside** Wix's network that has API access.

### Options:

#### A. **Use Railway/Render on VPN**
Some cloud providers support VPN connections:
- Railway.app with Tailscale
- Render.com with private networking

#### B. **Internal Wix Server**
Deploy `proxy-server.js.backup` to an internal Wix server:
```bash
# On internal server
node proxy-server.js.backup
```

Then update Vercel environment variable:
```bash
# In Vercel dashboard
API_TARGET = "https://your-internal-server.wix.com:3000"
```

### Benefits:
- ✅ Works with existing network restrictions
- ✅ No backend policy changes needed

### Drawbacks:
- 🔧 More infrastructure to manage
- 💰 May incur hosting costs
- 🐌 Extra network hop (slightly slower)

---

## ✅ **Solution 3: Hybrid - Static Deploy + Local Proxy**

### What to Do:
1. Deploy **only static files** (HTML/CSS/JS) to Vercel
2. Keep using your **local proxy** for API calls
3. Update frontend to point to your local machine

### Implementation:

Update `js/api.js`:
```javascript
// Use local proxy for API (your machine on VPN)
const API_BASE_URL = 'https://your-machine.ngrok.io/api';
```

Use ngrok or similar to expose your local proxy:
```bash
ngrok http 3000
```

### Benefits:
- ✅ Works immediately
- ✅ No backend changes
- ✅ Free

### Drawbacks:
- ❌ Requires your machine to be online
- ❌ Not production-ready
- 🐌 Slower (routes through your machine)

---

## ✅ **Solution 4: Frontend-Only Deploy (No Proxy)**

### What to Do:
If the BFCM dashboard is **only for internal use**:

1. Deploy static files to Vercel
2. Users must be on VPN
3. Frontend calls Wix API directly (CORS disabled in browsers via extension)

### Implementation:

Update `js/api.js`:
```javascript
const API_BASE_URL = 'https://wix-bo.com/_api/bfcm-dashboard-serverless';
```

Users install CORS browser extension:
- Chrome: "CORS Unblock"
- Firefox: "CORS Everywhere"

### Benefits:
- ✅ Simple deployment
- ✅ No proxy needed

### Drawbacks:
- ❌ Requires browser extension on every machine
- ❌ Only works on VPN
- ❌ Not production-ready

---

## 🎯 **Recommended Approach**

### For Production:
**Solution 1** - Allowlist Vercel IPs

### For Quick Demo/Testing:
**Solution 3** - Hybrid with ngrok

### For Internal Use Only:
**Solution 2B** - Deploy to internal Wix server

---

## 🔍 **Next Steps**

1. **Confirm the issue:** Check with backend team if Wix API has IP restrictions
2. **Choose solution:** Based on timeline and requirements
3. **Implement:** Follow the chosen solution above

---

## 📞 **Questions to Ask Backend Team**

1. Does `wix-bo.com/_api/bfcm-dashboard-serverless` have IP allowlisting?
2. Can we allowlist Vercel's IP ranges for BFCM?
3. Is there an internal proxy/gateway we should use instead?
4. What's the recommended way to access this API from external cloud services?

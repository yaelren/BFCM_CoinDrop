# Quick Message to Backend Dev

## 📧 Short Email Version

---

**Subject:** BFCM Dashboard - API Access from Vercel

Hey [Backend Dev Name],

Quick question about the BFCM API (`wix-bo.com/_api/bfcm-dashboard-serverless`):

**Problem:** I deployed the BFCM dashboard to Vercel, but the API calls timeout (504). Works fine locally with VPN.

**Question:** Does the API have network restrictions? (VPN/internal network only?)

**Options:**
1. Allowlist Vercel's IPs on the API
2. I deploy a proxy inside Wix network
3. Other solution you recommend?

Happy to chat more - what works best for your setup?

Thanks!
[Your Name]

---

## 💬 Slack Message Version

---

Hey @backend-dev! 👋

Building the BFCM dashboard - quick network question:

**Issue:** `wix-bo.com/_api/bfcm-dashboard-serverless` works locally but times out from Vercel (504)

**Question:** Does it require VPN/internal network?

**Solutions:**
• Allowlist Vercel IPs?
• Deploy internal proxy?
• Other ideas?

Let me know what makes sense! 🙏

---

## 💡 Follow-up If They Ask "What's the Error?"

---

**Error Details:**
```
GET https://bfcm-2025.vercel.app/api/ping
Status: 504 Gateway Timeout
Time: Exactly 10 seconds (our serverless function timeout)
```

**What happens:**
- Vercel serverless function → tries to call wix-bo.com
- Connection times out after 10s
- No response from API

**Local vs Production:**
- ✅ Local (with Wix VPN): Works perfectly
- ❌ Vercel (cloud): 504 timeout

**Hypothesis:**
API blocks external IPs or requires VPN connection

---

## 🔍 If They Ask "Can You Test Something?"

---

Sure! What do you need?

**I can:**
- Share Vercel IP ranges that need allowlisting
- Test specific endpoints
- Deploy proxy if you provide server access
- Try different API URLs if you have alternatives

**I need:**
- Access to reach the API from Vercel's cloud
- Either: IP allowlist OR internal proxy deployment

---

## 🎯 If They Ask "What's Vercel?"

---

Vercel is like Netlify or GitHub Pages - a static hosting service.

**Why Vercel:**
- Global CDN for fast loading
- Auto-deploys from GitHub
- Free hosting for dashboards

**The issue:**
- Vercel runs in the cloud (not Wix network)
- Can't reach internal Wix APIs
- Need a bridge between Vercel ↔ Wix

---

## 📊 If They Ask "What Traffic?"

---

**Very light:**
- 10-50 concurrent users (dashboard viewers)
- ~100-500 requests/minute during peak
- Only during BFCM weekend (Nov 24-27)
- Monitoring dashboard, not customer-facing

**No heavy load expected.**

---

## ⚙️ If They Prefer the Proxy Solution

---

Great! I have everything ready:

**What I need from DevOps:**
1. K8s namespace (or Docker host)
2. Internal DNS: `bfcm-proxy.wix-internal.com`
3. Network access to `wix-bo.com`

**What I'll provide:**
- Proxy code (150 lines Node.js)
- Docker/K8s configs
- Deployment instructions

**Resources:**
- CPU: 0.1 core
- Memory: 128MB
- Basically nothing 😄

Should I open a ticket?

---

## 🚨 If They Say "Security Won't Allow Allowlisting"

---

No problem! Let's go with the internal proxy.

I'll need help from DevOps to deploy it inside Wix network.

Who should I reach out to? Or can you help coordinate?

---

## ✅ If They Say "Let Me Check With Security"

---

Awesome, thank you!

While you check, is there:
- A staging/test environment I can test against?
- Someone from DevOps I should loop in?

Let me know what you find out! 🙏

---

## 🎉 If They Say "I'll Allowlist Vercel"

---

Amazing, thank you!! 🎉

Here are the IP ranges:
https://vercel.com/docs/deployments/ip-addresses

Let me know when it's done and I'll test immediately.

Really appreciate the help! 🙏

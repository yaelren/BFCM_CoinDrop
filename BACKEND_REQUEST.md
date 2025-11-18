# Request to Backend Team - BFCM Dashboard API Access

## 👋 Hi Backend Team!

I'm building the BFCM 2025 real-time dashboard and need help with API access.

---

## 🎯 The Situation

**What I built:**
- Frontend dashboard for monitoring BFCM orders in real-time
- Deployed to Vercel (like Netlify/GitHub Pages - a static hosting service)
- Uses your API: `https://wix-bo.com/_api/bfcm-dashboard-serverless`

**The problem:**
- ✅ Works perfectly on my local machine (with VPN)
- ❌ Times out when deployed to Vercel (504 Gateway Timeout after 10 seconds)

**Why:**
- Looks like the API has network restrictions
- Vercel's servers can't reach `wix-bo.com` (probably requires VPN or internal network)

---

## 🤔 What I Need

**One of these solutions:**

### Option 1: Allowlist Vercel's IPs (Simplest)
Can you allowlist Vercel's IP ranges on the BFCM API endpoint?

**Vercel IP ranges:** https://vercel.com/docs/deployments/ip-addresses

**Pros:**
- Easiest solution
- No extra infrastructure needed
- I just deploy and it works

**Cons:**
- Might not be allowed for security reasons
- Need to coordinate with security team

---

### Option 2: Internal Proxy (Most Flexible)
I deploy a tiny proxy server inside Wix's network that forwards API calls.

**How it works:**
```
My Dashboard (Vercel) → Proxy (Wix Network) → Your API (wix-bo.com)
                        ↑
                   This part needs help
```

**What I need from you/DevOps:**
- A place to run the proxy (K8s pod, Docker container, or VM)
- An internal URL like `bfcm-proxy.wix-internal.com`
- Network access to your API

**I'll provide:**
- Complete proxy code (150 lines, Node.js)
- Docker/K8s deployment files
- Documentation

**Pros:**
- Works with existing network restrictions
- Gives us more control
- Standard microservice pattern

**Cons:**
- Requires DevOps coordination
- Small additional infrastructure

---

### Option 3: Public API Endpoint (If Possible)
If the BFCM API can be made publicly accessible (even temporarily for BFCM weekend), that would work too.

**Pros:**
- Super simple
- No network issues

**Cons:**
- Might require security review
- May not be feasible

---

## 📊 Context

**Traffic:** ~10-50 concurrent users (dashboard viewers)
**Usage:** Only during BFCM weekend (Nov 24-27)
**Endpoints needed:**
- `/totals` - Order counts and GPV
- `/orders` - Recent orders list
- `/stores` - Store breakdown
- `/products` - Product breakdown
- `/ping` - Health check

**Currently these work locally but timeout from Vercel.**

---

## ❓ Questions for You

1. **Does `wix-bo.com/_api/bfcm-dashboard-serverless` have IP restrictions?**
   - VPN required?
   - Internal network only?

2. **Can we allowlist Vercel's IPs for this endpoint?**
   - Or is there a policy against this?

3. **Is there a preferred way to access internal APIs from external services?**
   - Existing proxy/gateway?
   - API Gateway?

4. **Who should I talk to about deploying a proxy if needed?**
   - Which DevOps team?
   - What's the process?

---

## 🎯 What I'm Asking

**Short term (this week):**
- Understand the network restrictions
- Agree on which solution works best

**Medium term (before BFCM):**
- Implement the solution
- Test end-to-end

---

## 📁 Resources I Have Ready

If we go with the proxy option, I have:
- ✅ Complete proxy server code
- ✅ Docker/K8s deployment configs
- ✅ Detailed deployment guide
- ✅ DevOps request template

GitHub: [github.com/yaelren/BFCM_CoinDrop](https://github.com/yaelren/BFCM_CoinDrop)

---

## 🚀 Timeline

- **Now:** Week of Nov 17
- **BFCM:** Nov 24-27
- **Ideal solution by:** Nov 20

Not super urgent, but would be great to have working before BFCM starts!

---

## 💬 Let's Chat!

Can we have a quick call or chat to discuss the best approach?

I'm flexible and happy to work with whatever solution fits Wix's infrastructure best.

Thanks for your help! 🙏

**[Your Name]**
**[Your Contact Info]**

# 🚀 Quick Start Guide

## Step-by-Step Setup

### 1️⃣ Ensure VPN is Connected
Make sure you're connected to the VPN that provides access to `wix-bo.com`

### 2️⃣ Start Proxy Server

Open a terminal and run:
```bash
cd /Users/yaelre/Documents/Repos/BFCM_CoinDrop
node proxy-server.js
```

**Expected output:**
```
🚀 CORS Proxy Server running
📡 Listening on: http://localhost:3000
🎯 Forwarding to: https://wix-bo.com/_api/bfcm-dashboard-serverless/_functions
```

✅ **Leave this terminal running!**

---

### 3️⃣ Open Dashboard

**Option A: Simple (may have issues)**
```bash
open index.html
```

**Option B: Recommended (use web server)**

Open a **NEW terminal** and run:
```bash
cd /Users/yaelre/Documents/Repos/BFCM_CoinDrop
python3 -m http.server 8000
```

Then open in browser: **http://localhost:8000**

---

### 4️⃣ Verify It's Working

**In Browser Console** (Cmd+Option+I):
```
✅ Should see:
🚀 Initializing BFCM Dashboard...
✅ API Connection successful
✅ Totals fetched: {orders_count: ..., gpv: ..., aov: ...}
✅ Orders fetched: 80 orders
```

**In Proxy Terminal:**
```
✅ Should see:
📡 Proxying: GET /ping -> https://wix-bo.com/...
✅ Response: 200 /ping
📡 Proxying: GET /totals -> https://wix-bo.com/...
✅ Response: 200 /totals
```

**On Dashboard:**
- Total Orders should show a large number (e.g., 892,569)
- Total GMV should show currency amount (e.g., $91,395,467.21)
- Recent orders should be scrolling/updating

---

## ❌ Troubleshooting

### Problem: "Unable to connect to API"

**Check:**
1. Is VPN connected? → Reconnect VPN
2. Is proxy server running? → Check Terminal 1
3. Is proxy on port 3000? → Run: `lsof -i :3000`

**Fix:**
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart proxy
node proxy-server.js
```

---

### Problem: CORS Error in Browser

**Symptom:**
```
Access to fetch at 'https://wix-bo.com/...' has been blocked by CORS policy
```

**Cause:** You're trying to access API directly without proxy

**Fix:**
1. Make sure `js/api.js` has: `const API_BASE_URL = 'http://localhost:3000';`
2. Ensure proxy server is running
3. Refresh browser page

---

### Problem: No Data Showing

**Check:**
1. Browser console - any red errors?
2. Proxy terminal - seeing requests come through?
3. VPN connection - might have dropped

**Fix:**
1. Refresh browser page
2. Check VPN status
3. Restart proxy server if needed

---

## 🎯 Success Checklist

- [ ] VPN connected
- [ ] Proxy server running (Terminal 1)
- [ ] Browser showing dashboard (http://localhost:8000)
- [ ] Console shows "✅ API Connection successful"
- [ ] Proxy terminal shows requests being forwarded
- [ ] Numbers updating on screen
- [ ] Recent orders scrolling

---

## 📝 Quick Commands

```bash
# Check if proxy is running
lsof -i :3000

# Kill proxy (if needed)
lsof -ti:3000 | xargs kill -9

# Start proxy
node proxy-server.js

# Start web server
python3 -m http.server 8000
```

---

## 🆘 Still Having Issues?

1. Check both terminals for error messages
2. Copy error messages from browser console
3. Verify VPN access to wix-bo.com: `curl https://wix-bo.com` (should get a response)
4. Try restarting everything:
   - Kill proxy server (Ctrl+C)
   - Kill web server (Ctrl+C)
   - Restart proxy
   - Restart web server
   - Refresh browser

---

**Need the custom design phase?** Once this is working, provide your design assets and we'll integrate!

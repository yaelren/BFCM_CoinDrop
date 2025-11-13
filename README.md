# BFCM Real-Time Dashboard

A real-time Black Friday Cyber Monday order monitoring dashboard displaying live order data from Wix BFCM API.

## 🎯 Overview

- **Display Resolution**: 4640x1760 (ultra-wide monitor)
- **Technology**: Vanilla JavaScript + HTML5 + CSS3
- **Data Source**: Wix BFCM Dashboard Serverless API
- **Update Frequency**:
  - Totals: Every 3 seconds
  - Orders: Every 2 seconds

## 📋 Requirements

- **Network**: VPN connection required to access Wix API
- **Browser**: Modern browser with JavaScript enabled (Chrome recommended)
- **Display**: 4640x1760 resolution screen (or browser window)

## 🚀 Setup Instructions

### 1. Connect to VPN
Ensure you are connected to the network VPN that provides access to `wix-bo.com` API.

### 2. Start the CORS Proxy Server
The proxy server bypasses browser CORS restrictions:

```bash
# Terminal 1: Start the proxy server
cd /Users/yaelre/Documents/Repos/BFCM_CoinDrop
node proxy-server.js

# You should see:
# 🚀 CORS Proxy Server running
# 📡 Listening on: http://localhost:3000
```

### 3. Open Dashboard in Browser
In a **new terminal**:

```bash
# Terminal 2: Start web server
cd /Users/yaelre/Documents/Repos/BFCM_CoinDrop
python3 -m http.server 8000

# Then open in browser: http://localhost:8000
```

**Or** simply open `index.html` directly (may have loading issues in some browsers).

### 4. Verify Connection
- Check browser console for connection status
- Look for "✅ API Connection successful" message
- Dashboard should display live data within a few seconds
- Proxy server terminal should show: "📡 Proxying: GET /ping"

## 📊 Displayed Data

### Metrics (Top Section)
- **Total Orders**: Cumulative order count
- **Total GMV**: Gross Merchandise Value (sum of all orders)
- **Average Order Value**: Average transaction amount

### Recent Orders Feed
- Location (City, Country)
- Order amount with currency
- Time since order was placed
- Updates in real-time (every 2 seconds)

## 🔧 API Endpoints Used

Base URL: `https://wix-bo.com/_api/bfcm-dashboard-serverless/_functions/`

- `GET /ping` - Connection test
- `GET /totals` - Overall metrics (orders_count, gpv, aov)
- `GET /orders` - Recent orders array with location, amount, timestamp
- `GET /stores` - Top stores (available, not currently displayed)
- `GET /products` - Top products (available, not currently displayed)

## 🐛 Troubleshooting

### "Unable to connect to API"
- ✅ Verify VPN connection is active
- ✅ **Ensure proxy server is running** (`node proxy-server.js`)
- ✅ Check proxy terminal for connection logs
- ✅ Verify proxy is on port 3000: `lsof -i :3000`
- ✅ Open browser console to see detailed error messages

### CORS Errors
- ✅ **Use the proxy server** (see Setup Instructions)
- ✅ Don't access API directly from browser - it will fail
- ✅ Proxy server must be running before opening dashboard

### Data Not Updating
- ✅ Check browser console for errors
- ✅ Verify proxy server is forwarding requests (check proxy terminal)
- ✅ Check VPN connection hasn't dropped
- ✅ Ensure JavaScript is enabled in browser

### Display Issues
- ✅ Confirm browser window is set to 4640x1760 or use full-screen mode
- ✅ Check browser zoom is set to 100%

### Port Already in Use
If proxy fails with "Port 3000 already in use":
```bash
# Kill existing process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port (update API_BASE_URL in js/api.js)
```

## 📁 Project Structure

```
BFCM_CoinDrop/
├── index.html          # Main dashboard page
├── proxy-server.js     # CORS proxy server (Node.js)
├── package.json        # Node.js package configuration
├── js/
│   ├── api.js          # API connection and data fetching
│   └── main.js         # Dashboard logic and UI updates
└── README.md           # This file
```

## 🎨 Current Design

**Phase 1**: Plain text on white background for functionality testing
- Clean, readable display of all data
- Real-time updates visible
- Connection status indicator

**Phase 2**: Custom design integration (pending user-provided assets)
- Background images/styling
- P5.js animations
- Custom layout and visual effects

## 🔍 Console Commands

Open browser console and use these commands for debugging:

```javascript
// Check API status
api.getStatus()

// Manual data fetch
api.fetchTotals()
api.fetchOrders()

// Stop/start polling
dashboard.stopPolling()
dashboard.startPolling()
```

## 📝 Notes

- No authentication required (VPN-gated access)
- Polling frequencies can be adjusted in `main.js`
- All console logs prefixed with emoji indicators (✅ success, ❌ error, 🔄 polling)
- Design customization awaiting user-provided specifications

## 🚦 Next Steps

1. ✅ Test API connectivity
2. ✅ Verify live data display
3. ⏳ Await custom design assets from user
4. ⏳ Integrate P5.js animations
5. ⏳ Apply final visual styling

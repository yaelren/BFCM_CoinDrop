# Vercel Deployment Guide

## ✅ Refactoring Complete!

Your BFCM Dashboard now uses **Vercel Serverless Functions** instead of a standalone Node.js proxy server. This allows **single deployment** that works both locally and in production.

---

## 📁 New Architecture

```
api/
├── totals.js      → /api/totals
├── orders.js      → /api/orders
├── stores.js      → /api/stores
├── products.js    → /api/products
└── ping.js        → /api/ping

lib/
└── proxy.js       → Shared proxy utility (handles CORS + Wix API forwarding)

js/
└── api.js         → Frontend client (updated to use /api/* paths)
```

---

## 🚀 Local Development

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Run development server**:
   ```bash
   npm run dev
   # or
   vercel dev
   ```

3. **Access your dashboard**:
   - Open: http://localhost:3000
   - API endpoints work at: http://localhost:3000/api/totals

### Option 2: Without Vercel CLI

If you don't want to install Vercel CLI, you can use the legacy proxy:
```bash
npm run legacy-proxy
```
Then update `js/api.js` line 7 to: `const API_BASE_URL = 'http://localhost:3000';`

---

## 🌐 Deploy to Vercel

### First-Time Deployment

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   # or
   vercel --prod
   ```

4. **Follow prompts**:
   - Set up and deploy? → `Y`
   - Which scope? → Select your account
   - Link to existing project? → `N` (first time)
   - Project name? → `bfcm-coindrop-dashboard` (or your choice)
   - Directory? → `./` (press Enter)
   - Override settings? → `N`

5. **Done!** Vercel will provide your live URL (e.g., `https://bfcm-coindrop-dashboard.vercel.app`)

### Subsequent Deployments

Just run:
```bash
npm run deploy
```

---

## 🎯 How It Works

### Local Development (`vercel dev`)
1. Vercel CLI simulates serverless functions locally
2. Frontend calls `/api/totals` → Vercel dev routes to `api/totals.js`
3. `api/totals.js` uses `lib/proxy.js` → Proxies to Wix API
4. Response includes CORS headers → No CORS errors!

### Production (Vercel)
1. Same `/api/totals` paths work in production
2. Vercel automatically deploys each `api/*.js` as a serverless function
3. No environment variable changes needed
4. Proxy bypasses CORS restrictions

---

## 📦 Package Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development with Vercel CLI |
| `npm start` | Alias for `npm run dev` |
| `npm run deploy` | Deploy to Vercel production |
| `npm run legacy-proxy` | Use old Node.js proxy (backup option) |

---

## 🔧 Configuration Files

### `vercel.json`
- Sets max function duration to 10 seconds
- Configures API route handling

### `.vercelignore`
- Excludes unnecessary files from deployment
- Keeps deployment size minimal

### `package.json`
- Updated scripts for Vercel workflow
- Legacy proxy kept as backup

---

## ⚡ Benefits

✅ **Single Deployment** - No separate backend server needed
✅ **Works Everywhere** - Same code locally and in production
✅ **CORS Bypass** - Serverless functions proxy to Wix API
✅ **Auto-Scaling** - Vercel handles traffic automatically
✅ **Zero Config** - Deploy with one command
✅ **Fast** - Edge network + serverless = blazing fast

---

## 🐛 Troubleshooting

### "vercel: command not found"
Install Vercel CLI globally:
```bash
npm i -g vercel
```

### Port 3000 already in use
Kill existing processes:
```bash
killall node
# or
lsof -ti:3000 | xargs kill -9
```

### API endpoints return 404
Make sure you're running `vercel dev`, not just opening `index.html`

### CORS errors in production
Check that your Vercel deployment includes the `api/` folder and `lib/proxy.js`

---

## 📚 Additional Resources

- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel Dev Command](https://vercel.com/docs/cli/dev)

---

## 🎉 You're Ready!

Your dashboard is now ready to deploy to Vercel with full proxy support!

**Next Steps:**
1. Run `npm run dev` to test locally
2. Run `npm run deploy` when ready to go live
3. Share your Vercel URL with the world! 🚀

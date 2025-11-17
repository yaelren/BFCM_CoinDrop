# Quick Start - Running Locally

## Option 1: With Vercel CLI (Recommended - 2 minutes)

### Step 1: Install Vercel CLI globally
```bash
npm install -g vercel
```

### Step 2: Run dev server
```bash
npm run dev
```

### Step 3: First time only - answer prompts
```
? Set up and develop "~/BFCM_CoinDrop"? [Y/n] Y
? Which scope should contain your project? → Select your account (or skip)
? Link to existing project? [y/N] N
? What's your project's name? → bfcm-coindrop-dashboard (or press Enter)
? In which directory is your code located? → ./ (press Enter)
```

### Step 4: Open browser
```
✅ Ready! Available at http://localhost:3000
```

**Done!** Your dashboard is running with working API proxy.

---

## Option 2: Without Installing Vercel CLI

If you don't want to install anything, you can use a simple static server, but **the API proxy won't work** (you'll get CORS errors from Wix API).

### Using Python (comes with Mac)
```bash
python3 -m http.server 3000
```

### Using npx (no global install)
```bash
npx vercel dev
```
This downloads Vercel temporarily - same as Option 1 but doesn't install globally.

---

## 🎯 What's Happening?

**`vercel dev` does 3 things:**
1. **Serves your HTML files** (like `index.html`, `led.html`)
2. **Runs serverless functions** (your `api/*.js` files)
3. **Routes requests** (`/api/totals` → `api/totals.js`)

Without it, your browser can't connect `/api/totals` to the actual function.

---

## ⚡ TL;DR

**Fastest way to run locally:**
```bash
npm install -g vercel && npm run dev
```

**Then open:** http://localhost:3000

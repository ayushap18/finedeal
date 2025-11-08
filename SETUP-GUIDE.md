# FineDeal - Setup Guide for New Laptop

## 📋 Prerequisites

Before starting, make sure you have:
- Git installed
- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Google Chrome browser

---

## 🚀 Step-by-Step Setup

### 1. Install Node.js (if not installed)

**Check if Node.js is installed:**
```bash
node --version
npm --version
```

**If not installed, download from:**
- https://nodejs.org/ (Download LTS version)

---

### 2. Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/ayushap18/finedeal.git

# Navigate to project directory
cd finedeal
```

---

### 3. Install Dependencies

```bash
# Install all required packages
npm install
```

This will install:
- TypeScript
- Webpack
- All build tools
- CSS loaders
- Type definitions

**Expected output:** `added XXX packages` (takes 1-2 minutes)

---

### 4. Build the Extension

```bash
# Build production version
npm run build
```

This creates a `dist/` folder with the compiled extension.

**Expected output:**
```
✔ webpack compiled successfully
✔ Created dist/ folder with extension files
```

---

### 5. Load Extension in Chrome

**Method 1: Load Unpacked Extension**

1. Open Chrome browser
2. Go to: `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `finedeal/dist/` folder
6. Extension icon should appear in Chrome toolbar!

**Method 2: Pack as .crx file**

```bash
# Create a production ZIP
cd dist
zip -r finedeal-extension.zip *
cd ..
```

Then drag `finedeal-extension.zip` to `chrome://extensions/`

---

## 🧪 Test the Extension

1. Go to any product page on:
   - Amazon.in
   - Flipkart.com
   - Myntra.com
   - etc.

2. Click the **FineDeal** extension icon

3. Click **"Compare Prices"**

4. Wait 3-4 seconds for results!

---

## 🛠️ Development Commands

### Build Commands
```bash
# Development build (with source maps)
npm run build

# Clean build folder
npm run clean

# Clean + Build
npm run prebuild
```

### Watch Mode (Auto-rebuild on changes)
```bash
# Not configured yet, but you can add to package.json:
npm run watch
```

---

## 📁 Project Structure

```
finedeal/
├── src/                    # Source code (TypeScript)
│   ├── background/        # Service worker
│   ├── content/           # Content scripts
│   ├── popup/             # Extension popup UI
│   ├── config/            # Site configurations
│   ├── services/          # Matching & caching
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript types
├── dist/                   # Built extension (load this in Chrome)
├── node_modules/          # Dependencies (auto-generated)
├── package.json           # Project config
├── tsconfig.json          # TypeScript config
├── webpack.config.js      # Build config
└── README.md              # Documentation
```

---

## 🔧 Troubleshooting

### Problem: `command not found: npm`
**Solution:** Install Node.js from https://nodejs.org/

### Problem: `Module not found` errors
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: Build fails with TypeScript errors
**Solution:**
```bash
npm install typescript --save-dev
npm run build
```

### Problem: Extension not loading in Chrome
**Solution:**
1. Make sure you selected the `dist/` folder, not root
2. Check that `dist/manifest.json` exists
3. Reload extension: `chrome://extensions/` → Click reload icon

### Problem: Extension works but shows no results
**Solution:**
1. Open Console: Right-click extension → Inspect → Console
2. Check for error messages
3. Clear cache: Click "🗑️ Clear Cache" in extension footer

---

## 🔄 Updating the Extension

### Pull Latest Changes
```bash
git pull origin main
npm install  # Install any new dependencies
npm run build
```

### Reload in Chrome
1. Go to `chrome://extensions/`
2. Find FineDeal extension
3. Click the **reload icon** 🔄

---

## 📦 Creating Production Package

### For Chrome Web Store
```bash
# Build production version
npm run build

# Create ZIP (excluding source maps)
cd dist
zip -r ../finedeal-v3.0.zip * -x "*.map"
cd ..
```

Upload `finedeal-v3.0.zip` to Chrome Web Store.

---

## 🌐 Environment-Specific Notes

### macOS
```bash
# No special setup needed
npm install
npm run build
```

### Windows
```bash
# Use PowerShell or Command Prompt
npm install
npm run build
```

### Linux
```bash
# May need to install build tools
sudo apt-get install build-essential
npm install
npm run build
```

---

## 📊 Performance Features (Built-in)

✅ Smart wait detection (MutationObserver)  
✅ 5-minute caching (chrome.storage.local)  
✅ Parallel query strategy  
✅ Brand normalization (50+ brands)  
✅ Price validation (flags suspicious prices)  
✅ Fuzzy price matching  
✅ Batch search (3 tabs at a time)  

**Speed:** 3-4s first search, <1s cached  
**Accuracy:** 85-90% match rate  
**Sites:** 8+ Indian e-commerce sites  

---

## 🆘 Need Help?

- Check console logs: Right-click extension → Inspect
- Review README.md for features
- Check GitHub issues: https://github.com/ayushap18/finedeal/issues

---

## ✅ Quick Start Checklist

- [ ] Node.js installed (v16+)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Extension built (`npm run build`)
- [ ] Loaded in Chrome (`chrome://extensions/`)
- [ ] Tested on a product page
- [ ] Results appear in 3-4 seconds!

---

**You're all set! Happy price hunting! 🎉**

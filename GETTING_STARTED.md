# Getting Started with Worko Browser Extension

This guide will help you set up, build, and test the Worko Browser Extension locally.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Google Chrome** (for testing)
- **Git** (for version control)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd worko-browser-extension

# Install dependencies
npm install
```

### 2. Build the Extension

```bash
# Development build with watch mode
npm run dev

# Or for production build
npm run build
```

The build process will create a `dist` folder containing the compiled extension files.

## 🌐 Loading Extension in Chrome

### Step 1: Open Chrome Extensions Page

- **Method 1**: Go to `chrome://extensions/` in your Chrome browser
- **Method 2**: Click Chrome menu (⋮) → More tools → Extensions

### Step 2: Enable Developer Mode

- Toggle the **"Developer mode"** switch in the top right corner
- This enables the ability to load unpacked extensions

### Step 3: Load the Extension

1. Click the **"Load unpacked"** button
2. Navigate to your `worko-browser-extension` project folder
3. Select the **`dist`** folder (not the root project folder)
4. Click **"Select Folder"**

### Step 4: Verify Installation

✅ You should see "Worko Job Matcher" in your extensions list  
✅ The Worko extension icon should appear in your browser toolbar  
✅ No error messages should be displayed  

## 🧪 Testing the Extension

### Test 1: Basic Functionality

1. **Click the extension icon** in your Chrome toolbar
2. **Expected**: Popup opens showing the login interface
3. **Expected**: "Welcome to Worko!" message with login button

### Test 2: Job Page Detection

1. **Visit any website** (like google.com)
2. **Click the extension icon**
3. **Expected**: "Visit a job page to score" message

4. **Visit a Naukri job page** (e.g., naukri.com/job-listings/)
5. **Click the extension icon**
6. **Expected**: "Score This Job" button should be enabled

### Test 3: Content Script Injection

#### On Naukri:
1. **Navigate to a Naukri job details page**
2. **Expected**: Worko banner appears at the top with blue gradient background
3. **Expected**: "Score Job" button visible in the injected UI

#### On LinkedIn:
1. **Navigate to a LinkedIn job posting** (/jobs/view/)
2. **Expected**: Worko integration bar appears in the job details
3. **Expected**: Clean white background with Worko branding

### Test 4: Authentication Flow (Placeholder)

1. **Click "Login with Worko"** in the popup
2. **Expected**: Loading state appears briefly
3. **Expected**: Currently shows placeholder - actual auth will be implemented in Task 2

## 🔧 Development Workflow

### Making Changes

1. **Edit source files** in the `src/` directory
2. **Webpack automatically rebuilds** (if using `npm run dev`)
3. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Find "Worko Job Matcher"
   - Click the **refresh icon** 🔄
4. **Test your changes**

### File Structure

```
src/
├── background/          # Service worker
├── content/            # Content scripts for job platforms
├── popup/              # Extension popup UI
├── shared/             # Shared utilities and config
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

dist/                   # Built extension files (generated)
```

## 🐛 Debugging

### Background Script Debugging

1. Go to `chrome://extensions/`
2. Find "Worko Job Matcher"
3. Click **"Inspect views: background page"**
4. DevTools opens for the background script

### Popup Debugging

1. **Right-click** the extension icon
2. Select **"Inspect popup"**
3. DevTools opens for the popup

### Content Script Debugging

1. **Open DevTools** on the job page (F12)
2. **Check Console tab** for extension logs
3. **Look for** "Worko Extension" messages

### Common Debug Messages

```javascript
// Expected console messages:
"Worko Extension: Naukri content script loaded"
"Worko Extension: LinkedIn content script loaded"
"Worko Extension background script loaded"
"Worko Extension popup loaded"
```

## 🚨 Troubleshooting

### Extension Won't Load

**Problem**: "Load unpacked" fails or shows errors

**Solutions**:
- ✅ Ensure you selected the `dist` folder, not the root folder
- ✅ Run `npm run build` to generate the dist folder
- ✅ Check that `manifest.json` exists in the dist folder
- ✅ Verify no syntax errors in the console

### Content Scripts Not Working

**Problem**: No Worko UI appears on job pages

**Solutions**:
- ✅ Refresh the job page after loading the extension
- ✅ Check browser console for JavaScript errors
- ✅ Verify you're on the correct domains (naukri.com, linkedin.com)
- ✅ Ensure content scripts are enabled in extension settings

### Popup Not Opening

**Problem**: Clicking extension icon does nothing

**Solutions**:
- ✅ Check for popup blocking in Chrome settings
- ✅ Right-click extension icon and select "Inspect popup" to see errors
- ✅ Verify popup.html exists in the dist folder

### Permission Errors

**Problem**: Extension can't access job sites

**Solutions**:
- ✅ Check that host permissions are granted in `chrome://extensions/`
- ✅ Verify manifest.json includes correct host_permissions
- ✅ Try reloading the extension

## 📊 Testing Checklist

Use this checklist to verify everything is working:

### Basic Setup
- [ ] Dependencies installed (`npm install` completed)
- [ ] Extension builds without errors (`npm run dev`)
- [ ] Extension loads in Chrome without errors
- [ ] Extension icon appears in toolbar

### Popup Functionality
- [ ] Popup opens when clicking extension icon
- [ ] Login interface displays correctly
- [ ] Worko branding and colors are correct
- [ ] No console errors in popup DevTools

### Job Page Detection
- [ ] "Score This Job" button disabled on non-job pages
- [ ] "Score This Job" button enabled on Naukri job pages
- [ ] "Score This Job" button enabled on LinkedIn job pages

### Content Script Injection
- [ ] Worko banner appears on Naukri job pages
- [ ] Worko integration bar appears on LinkedIn job pages
- [ ] UI elements are properly styled
- [ ] No layout conflicts with existing page content

### Console Logs
- [ ] Background script loads without errors
- [ ] Content scripts load on appropriate pages
- [ ] No red error messages in any console

## 🎯 Next Steps

Once you've completed all tests successfully:

1. **Ready for Task 2**: Implement AWS Amplify authentication
2. **Ready for Task 3**: Build the popup UI with Worko theme
3. **Ready for Task 4**: Implement local job matching algorithm

## 💡 Tips for Development

- **Use `npm run dev`** for development - it watches for changes
- **Keep DevTools open** while testing to catch errors early
- **Test on real job pages** from both Naukri and LinkedIn
- **Clear browser cache** if you see stale content
- **Use incognito mode** for clean testing environment

## 📞 Need Help?

If you encounter issues not covered in this guide:

1. **Check the main README.md** for additional information
2. **Look at the browser console** for specific error messages
3. **Verify your Node.js and npm versions** meet requirements
4. **Try the production build** (`npm run build`) if dev build fails

---

**Happy coding! 🚀** The extension foundation is now ready for implementing the core features.
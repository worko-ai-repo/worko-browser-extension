# 📦 Worko Extension Development Package

## 🎯 Package Details

**File**: `worko-extension-dev.zip`  
**Size**: ~335KB  
**Type**: Development Build (Unminified)  
**Chrome Extension**: Manifest V3

## 📋 Package Contents

### Core Files
- `manifest.json` - Extension manifest
- `background.js` - Service worker (67KB)
- `popup.html` & `popup.js` - Extension popup interface
- `popup.css` - Popup styling

### Content Scripts
- `content-linkedin.js` (29KB) - LinkedIn integration
- `content-naukri.js` (25KB) - Naukri/NaukriGulf integration
- `content-linkedin.css` (40KB) - LinkedIn UI styles
- `content-naukri.css` (40KB) - Naukri UI styles

### Assets
- `icons/` - Extension icons (16px, 32px, 48px, 96px, 128px)
- `types/` - TypeScript definitions
- `shared/` - Shared utilities and configurations

## ✅ Features Included

### 🔧 Core Functionality
- ✅ Job scoring and matching
- ✅ Skills analysis and recommendations
- ✅ User profile management
- ✅ API integration with Worko backend

### 🌐 Platform Support
- ✅ **LinkedIn** - Job detail pages
- ✅ **Naukri.com** - Job detail pages
- ✅ **NaukriGulf.com** - Job detail pages

### 🎨 UI Components
- ✅ Job matching banner/widget
- ✅ Score display with color coding
- ✅ Detailed breakdown modal
- ✅ Skills matching visualization
- ✅ Apply button integration

### 🐛 Development Features
- ✅ Detailed console logging
- ✅ Debug functions (`window.workoDebug()`)
- ✅ Error handling and fallbacks
- ✅ Source maps for debugging

## 🚀 Recent Fixes

### DOM Insertion Fix
- ✅ Fixed `insertBefore` DOM errors on NaukriGulf
- ✅ Improved element detection and targeting
- ✅ Added safe fallback insertion methods
- ✅ Enhanced error handling

### UI Improvements
- ✅ Better page detection for job detail pages
- ✅ Improved banner placement and styling
- ✅ Responsive design for different screen sizes
- ✅ Consistent branding across platforms

## 📥 Installation

1. **Extract** `worko-extension-dev.zip`
2. **Open** Chrome Extensions (`chrome://extensions/`)
3. **Enable** Developer Mode
4. **Click** "Load unpacked"
5. **Select** the extracted folder

## 🧪 Testing Checklist

### LinkedIn Testing
- [ ] Visit LinkedIn job detail page
- [ ] Verify Worko banner appears
- [ ] Test "Score Job" functionality
- [ ] Check "View Details" modal
- [ ] Test "Apply" button integration

### Naukri Testing
- [ ] Visit Naukri.com job detail page
- [ ] Verify Worko banner appears
- [ ] Test job scoring
- [ ] Check skills breakdown
- [ ] Verify no console errors

### NaukriGulf Testing
- [ ] Visit NaukriGulf.com job detail page
- [ ] Verify banner placement
- [ ] Test all functionality
- [ ] Confirm DOM insertion fix works

## 🔍 Debug Information

### Console Commands
```javascript
// Test extension loading
window.workoDebug()

// Force UI injection
window.workoTestInject()
```

### Console Logs to Check
- Page detection results
- Element targeting information
- API communication status
- UI injection success/failure

## ⚠️ Important Notes

- **Development Build Only** - Not for production use
- **Unminified Code** - Larger file sizes, easier debugging
- **Detailed Logging** - May impact performance
- **Source Maps Included** - For development debugging

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify correct page type (job detail pages only)
3. Try refreshing the page
4. Report with browser version and URL

---

**Build Date**: $(date)  
**Version**: 1.0.0-dev  
**Webpack Mode**: Development
# Worko Browser Extension - Development Build

## 📦 Installation Instructions

This is a **development build** of the Worko Browser Extension for testing purposes.

### 🔧 Prerequisites
- Google Chrome or Chromium-based browser
- Developer mode enabled in Chrome Extensions

### 📥 Installation Steps

1. **Download the Extension**
   - Download `worko-extension-dev.zip` from the shared location
   - Extract the ZIP file to a folder on your computer

2. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle **"Developer mode"** ON (top-right corner)

3. **Load the Extension**
   - Click **"Load unpacked"** button
   - Select the extracted folder containing the extension files
   - The extension should now appear in your extensions list

4. **Verify Installation**
   - Look for the Worko icon in your browser toolbar
   - Visit a job page on LinkedIn or Naukri to test functionality

### 🎯 Supported Platforms

- **LinkedIn**: Job detail pages
- **Naukri.com**: Job detail pages  
- **NaukriGulf.com**: Job detail pages

### 🧪 Testing Features

1. **Job Scoring**
   - Navigate to any job detail page on supported platforms
   - Look for the Worko banner/widget
   - Click "Score Job" to test the matching functionality

2. **View Details**
   - After scoring, click "View Details" to see the breakdown modal
   - Check skill matching and recommendations

3. **Apply Integration**
   - Test the "Apply" button integration with platform apply buttons

### 🐛 Debug Information

- Open Chrome DevTools (F12) to see console logs
- The extension logs detailed information about:
  - Page detection
  - UI injection
  - Job data extraction
  - API communication

### 🔍 Debug Commands

Open the browser console and try these commands:
```javascript
// Test if extension is loaded
window.workoDebug()

// Force UI injection test
window.workoTestInject()
```

### ⚠️ Development Build Notes

- This is a **development build** with:
  - Unminified code for easier debugging
  - Detailed console logging
  - Source maps included
  - Not optimized for performance

- **Do not use in production**
- For testing and feedback purposes only

### 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify you're on a supported job detail page
3. Try refreshing the page
4. Report issues with:
   - Browser version
   - Platform (LinkedIn/Naukri/NaukriGulf)
   - Job page URL
   - Console error messages

### 🔄 Updates

To update the extension:
1. Download the new version
2. Extract to the same folder (overwrite existing files)
3. Go to `chrome://extensions/`
4. Click the refresh icon on the Worko extension card

---

**Version**: Development Build  
**Last Updated**: $(date)  
**Build Type**: Development (Unminified)
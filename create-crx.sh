#!/bin/bash

# Script to create a .crx packaged extension file
# Usage: ./create-crx.sh

echo "🚀 Creating Worko Extension .crx package..."

# Build the extension
echo "📦 Building extension..."
npm run build:dev

# Check if chrome command exists
if command -v google-chrome &> /dev/null; then
    CHROME_CMD="google-chrome"
elif command -v chromium &> /dev/null; then
    CHROME_CMD="chromium"
elif command -v chrome &> /dev/null; then
    CHROME_CMD="chrome"
else
    echo "❌ Chrome/Chromium not found in PATH"
    echo "📋 Manual steps:"
    echo "1. Open chrome://extensions/"
    echo "2. Enable Developer mode"
    echo "3. Click 'Pack extension'"
    echo "4. Select the 'dist' folder"
    echo "5. Chrome will create worko-extension.crx"
    exit 1
fi

# Create private key if it doesn't exist
if [ ! -f "worko-extension.pem" ]; then
    echo "🔑 Generating private key..."
    openssl genrsa -out worko-extension.pem 2048
fi

# Package the extension using Chrome
echo "📦 Packaging extension..."
$CHROME_CMD --pack-extension=./dist --pack-extension-key=./worko-extension.pem

if [ -f "dist.crx" ]; then
    mv dist.crx worko-extension.crx
    echo "✅ Extension packaged successfully!"
    echo "📁 Files created:"
    echo "   - worko-extension.crx (installable package)"
    echo "   - worko-extension.pem (private key - keep secure!)"
    echo ""
    echo "📥 To install:"
    echo "1. Open chrome://extensions/"
    echo "2. Enable Developer mode"
    echo "3. Drag and drop worko-extension.crx"
    echo "4. Click 'Add extension'"
else
    echo "❌ Failed to create .crx file"
    echo "📋 Try manual packaging:"
    echo "1. Open chrome://extensions/"
    echo "2. Enable Developer mode"
    echo "3. Click 'Pack extension'"
    echo "4. Select the 'dist' folder"
fi
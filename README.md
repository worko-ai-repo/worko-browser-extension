# Worko Browser Extension

AI-powered job matching extension that helps you find the perfect job opportunities on Naukri and LinkedIn.

## Features

- 🔐 **Secure Authentication** - Login with your existing Worko account using AWS Cognito OIDC
- 🎯 **Smart Job Matching** - Local AI-powered scoring algorithm that matches jobs to your profile
- 📊 **Detailed Analytics** - Comprehensive score breakdown showing skills, experience, and education match
- 📱 **Cross-Platform** - Works seamlessly on Naukri and LinkedIn
- 🎨 **Worko Brand Experience** - Consistent design with the Worko ecosystem
- 🔒 **Privacy First** - All job matching happens locally, your data stays private

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd worko-browser-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.development .env
   # Update the environment variables as needed
   ```

4. **Build the extension**
   ```bash
   npm run dev    # Development build with watch mode
   npm run build  # Production build
   ```

5. **Load in browser**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Production Build

```bash
npm run build
```

The built extension will be in the `dist` folder, ready for packaging and distribution.

## Development

### Project Structure

```
src/
├── background/          # Service worker and background scripts
├── content/            # Content scripts for job platforms
├── popup/              # Extension popup UI
├── shared/             # Shared utilities and configurations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Available Scripts

- `npm run dev` - Development build with watch mode
- `npm run build` - Production build
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Testing

```bash
npm test                # Run all tests
npm test -- --watch    # Run tests in watch mode
npm test -- --coverage # Run tests with coverage report
```

## Architecture

### Authentication Flow
1. User clicks login in extension popup
2. AWS Amplify initiates Cognito OIDC flow
3. User authenticates via Worko's hosted UI
4. Extension receives and stores JWT tokens securely
5. API calls use stored tokens for authentication

### Job Matching Flow
1. User visits Naukri or LinkedIn job page
2. Content script extracts job details
3. Local matching algorithm compares job with user profile
4. Score and breakdown displayed in extension popup
5. Job history stored locally for privacy

### Data Flow
- **Authentication**: AWS Amplify → Cognito → Chrome Storage
- **User Profile**: Worko API → Chrome Storage → Local Matching
- **Job Data**: Content Scripts → Background Script → Local Storage
- **Scoring**: Local Algorithm → UI Display → History Storage

## Configuration

### Environment Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `WORKO_API_BASE_URL` | Worko API endpoint | `https://dev-api.worko.ai` | `https://api.worko.ai` |
| `WORKO_COGNITO_USER_POOL_ID` | Cognito User Pool ID | `ap-south-1_xGreJKkNc` | Production Pool ID |
| `WORKO_COGNITO_CLIENT_ID` | Cognito Client ID | Development Client ID | Production Client ID |

### Feature Flags

- `ENABLE_DEBUG_LOGGING` - Enable detailed logging (dev only)
- `ENABLE_PERFORMANCE_MONITORING` - Track performance metrics
- `ENABLE_ERROR_REPORTING` - Report errors to monitoring service

## Browser Support

- ✅ Chrome 88+
- ✅ Firefox 78+
- ✅ Edge 88+
- ✅ Safari 14+ (with limitations)

## Security

- JWT tokens encrypted in browser storage
- HTTPS-only communication
- Content Security Policy enforced
- No sensitive data logged in production
- Automatic token cleanup on logout

## Privacy

- Job descriptions processed locally
- No job data sent to external servers
- User profile cached locally
- History stored in browser only
- GDPR compliant data handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the existing code style
- Ensure cross-browser compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- 📧 Email: support@worko.ai
- 🌐 Website: https://worko.ai
- 📚 Documentation: https://docs.worko.ai

---

Made with ❤️ by the Worko team
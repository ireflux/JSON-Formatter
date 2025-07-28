# JSON Formatter

A modern, high-performance JSON formatter built with Vue 3 and Monaco Editor. This tool provides a professional-grade interface for formatting, validating, and comparing JSON data with enhanced accessibility and performance optimizations.

## ✨ Features

### Core Functionality
- 🎨 **Beautiful Dark Theme**: Modern and eye-friendly dark theme interface
- ✨ **Real-time Formatting**: Automatic JSON formatting with debounced processing
- 📋 **Advanced Copy Operations**: 
  - Copy formatted JSON with fallback mechanisms
  - Copy minified JSON with compression statistics
  - Clipboard API with graceful degradation
- 🔍 **JSON Comparison**: Built-in diff viewer to compare two JSON documents
- 🎯 **Smart Validation**: Real-time JSON validation with detailed error messages
- 📊 **Performance Metrics**: Processing time and compression ratio display

### Editor Features
- ⌨️ **Monaco Editor Integration**: VS Code-like editing experience
- 🎨 **Syntax Highlighting**: Full JSON syntax highlighting
- � ***Auto-completion**: Smart auto-indentation and bracket matching
- � ***Line Numbers**: Configurable line number display
- 📱 **Word Wrap**: Intelligent word wrapping
- 🖱️ **Multi-cursor Support**: Advanced text selection and editing
- ⌨️ **Keyboard Shortcuts**: Comprehensive keyboard navigation

### Accessibility & UX
- ♿ **WCAG Compliant**: Full accessibility support with ARIA labels
- ⌨️ **Keyboard Navigation**: Complete keyboard accessibility
- 🔊 **Screen Reader Support**: Announcements and status updates
- 🎯 **Focus Management**: Proper focus handling and skip links
- 📱 **Responsive Design**: Optimized for all screen sizes
- 🌙 **System Theme Support**: Respects user's theme preferences

### Performance & Reliability
- 🚀 **Optimized Performance**: Lazy loading and resource management
- 🛡️ **Error Boundaries**: Comprehensive error handling and recovery
- 💾 **Memory Management**: Proper cleanup and leak prevention
- ⚡ **Debounced Operations**: Efficient processing for large files
- 🔄 **Graceful Fallbacks**: Robust fallback mechanisms

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ireflux/JSON-Formatter.git
cd JSON-Formatter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Type check and build
npm run build:prod

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

## 🎮 Usage

### Basic Operations
1. **Format JSON**: Paste JSON data into the editor for automatic formatting
2. **Copy Content**: Use the copy button or `Ctrl/Cmd + C` to copy formatted JSON
3. **Minify JSON**: Use "Compress & Copy" or `Ctrl/Cmd + Shift + C` for minified output
4. **Compare JSON**: Toggle diff mode with `Ctrl/Cmd + D` to compare two JSON documents

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Format JSON
- `Ctrl/Cmd + C`: Copy formatted JSON
- `Ctrl/Cmd + Shift + C`: Copy minified JSON
- `Ctrl/Cmd + D`: Toggle diff mode
- `F1` or `Ctrl/Cmd + /`: Show keyboard shortcuts help
- `Escape`: Clear validation errors

### Advanced Features
- **Error Recovery**: Automatic error detection with recovery suggestions
- **Performance Stats**: View processing time and compression ratios
- **Accessibility**: Full screen reader support and keyboard navigation
- **Responsive Design**: Optimized experience across all devices

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # Reusable Vue components
│   ├── EditorHeader.vue    # Header with controls
│   ├── LoadingSpinner.vue  # Loading indicators
│   └── ToastNotification.vue # Notification system
├── composables/         # Vue 3 composables
│   ├── useMonacoEditor.js  # Editor management
│   ├── useJsonFormatter.js # JSON processing
│   ├── useClipboard.js     # Clipboard operations
│   └── useToast.js         # Notification system
├── constants/           # Configuration constants
│   └── editorConfig.js     # Monaco editor config
├── utils/              # Utility functions
│   ├── debounce.js        # Performance utilities
│   └── errorHandling.js   # Error management
├── types/              # TypeScript definitions
│   └── index.ts           # Type definitions
└── styles.css          # Global styles with CSS variables
```

### Key Technologies
- **Vue 3**: Modern reactive framework with Composition API
- **Monaco Editor**: VS Code editor component for web
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and development server
- **CSS Custom Properties**: Consistent theming and styling

### Design Patterns
- **Composables**: Reusable business logic with Vue 3 Composition API
- **Error Boundaries**: Comprehensive error handling and recovery
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility First**: WCAG compliant design and implementation

## 🧪 Development

### Code Style
- **Vue 3 Composition API**: Modern reactive patterns
- **TypeScript**: Type-safe development
- **ESLint + Prettier**: Consistent code formatting
- **Semantic Versioning**: Clear version management

### Performance Optimizations
- **Lazy Loading**: Monaco Editor loaded on demand
- **Debounced Operations**: Efficient processing for large files
- **Memory Management**: Proper cleanup and resource management
- **Bundle Optimization**: Tree shaking and code splitting

### Testing Strategy
- **Unit Tests**: Composables and utility functions
- **Integration Tests**: Component interactions
- **E2E Tests**: Complete user workflows
- **Accessibility Tests**: WCAG compliance verification

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper tests
4. Ensure all tests pass: `npm run test`
5. Submit a pull request

### Code Standards
- Follow Vue 3 Composition API patterns
- Include TypeScript types for new features
- Add tests for new functionality
- Ensure accessibility compliance
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Powerful code editor
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ireflux/JSON-Formatter/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ireflux/JSON-Formatter/discussions)
- 📧 **Contact**: [Project Maintainers](mailto:maintainers@json-formatter.dev)

---

**Made with ❤️ by the JSON Formatter Team**

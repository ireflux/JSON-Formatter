# JSON Formatter

A JSON formatting and comparison tool built with Vue 3 and Monaco Editor.

## Features

- Format JSON with `Ctrl/Cmd + Enter`
- Copy current editor content
- Minify and copy JSON (`Ctrl/Cmd + Shift + C`)
- Compare JSON in diff mode (`Ctrl/Cmd + D`)
- Monaco Editor with syntax highlighting and editing assistance
- Clipboard fallback support for older browsers
- Inline toast feedback for operations and errors

## Project Structure

```text
src/
  App.vue                        # App-level orchestration
  components/
    AppHeader.vue                # Header action buttons
    AppToast.vue                 # Inline toast presentation
  composables/
    useMonacoEditor.js           # Editor lifecycle and diff-mode management
    useJsonFormatter.js          # JSON validate/format/minify utilities
    useClipboard.js              # Clipboard operations with fallback
    useInlineToast.js            # Lightweight toast state manager
  constants/
    editorConfig.js              # Monaco and formatter constants
  utils/
    monacoLoader.js              # Monaco loader configuration (local dependency)
    errorHandling.js             # Shared error handling helpers
  styles.css                     # Global styles and design tokens
```

## Development

### Prerequisites

- Node.js 16+
- npm

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Notes

- Monaco is loaded from the local `monaco-editor` dependency (no CDN pinning mismatch).
- Diff editor is lazily initialized on first entry to diff mode.

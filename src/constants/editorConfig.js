/**
 * Monaco Editor configuration constants
 * Centralized configuration to avoid duplication and improve maintainability
 */

export const EDITOR_THEMES = {
  DARK: 'vs-dark',
  LIGHT: 'vs-light'
}

export const EDITOR_LANGUAGES = {
  JSON: 'json',
  JAVASCRIPT: 'javascript'
}

/**
 * Base configuration for Monaco Editor instances
 */
export const BASE_EDITOR_CONFIG = {
  language: EDITOR_LANGUAGES.JSON,
  theme: EDITOR_THEMES.DARK,
  automaticLayout: true,
  fontSize: 14,
  lineHeight: 20,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  minimap: {
    enabled: true,
    side: 'right',
    showSlider: 'mouseover',
    renderCharacters: true,
    maxColumn: 120,
    scale: 1
  },
  padding: {
    top: 16,
    bottom: 16
  },
  multiCursorModifier: 'alt',
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'brackets',
  formatOnPaste: true,
  formatOnType: true,
  renderWhitespace: 'none',
  renderControlCharacters: false,
  renderIndentGuides: true,
  renderLineHighlight: 'all',
  contextmenu: true,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    useShadows: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10
  }
}

/**
 * Configuration specific to diff editor
 */
export const DIFF_EDITOR_CONFIG = {
  ...BASE_EDITOR_CONFIG,
  originalEditable: true,
  readOnly: false,
  renderSideBySide: true
}

/**
 * Default JSON content for new editors
 */
export const DEFAULT_JSON_CONTENT = '{\n  "example": "json"\n}'

/**
 * JSON formatting configuration
 */
export const JSON_FORMAT_CONFIG = {
  INDENT_SIZE: 4,
  MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB limit
}

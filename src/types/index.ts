/**
 * Type definitions for the JSON Formatter application
 */

// Vue 3 specific types (using generic types for compatibility)
export type Ref<T> = {
  value: T
}

export type ComputedRef<T> = {
  readonly value: T
}

// Editor types
export interface EditorState {
  isLoading: boolean
  isDiffMode: boolean
  isInitialized: boolean
}

export interface EditorConfig {
  theme: string
  language: string
  fontSize: number
  lineHeight: number
  tabSize: number
  insertSpaces: boolean
  wordWrap: string
  automaticLayout: boolean
  minimap: {
    enabled: boolean
  }
  padding: {
    top: number
    bottom: number
  }
  scrollBeyondLastLine: boolean
  multiCursorModifier: string
  quickSuggestions: boolean
  suggestOnTriggerCharacters: boolean
  autoClosingBrackets: string
  autoClosingQuotes: string
  autoSurround: string
  formatOnPaste: boolean
  formatOnType: boolean
  renderWhitespace: string
  renderControlCharacters: boolean
  renderIndentGuides: boolean
  renderLineHighlight: string
  scrollbar: {
    vertical: string
    horizontal: string
    useShadows: boolean
    verticalScrollbarSize: number
    horizontalScrollbarSize: number
  }
}

// JSON Formatter types
export interface JsonValidationResult {
  isValid: boolean
  error: Error | null
  data: any
}

export interface FormatStats {
  originalSize: number
  formattedSize: number
  compressionRatio: string
  processingTime: string
}

export interface JsonComparison {
  areEqual: boolean
  differences: JsonDifference[]
  summary: {
    totalDifferences: number
    addedKeys: number
    removedKeys: number
    modifiedKeys: number
  }
}

export interface JsonDifference {
  path: string
  type: 'added' | 'removed' | 'modified'
  oldValue?: any
  newValue?: any
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  action: (toast?: Toast) => void
  primary?: boolean
}

export interface Toast {
  id: number
  message: string
  type: ToastType
  visible: boolean
  timestamp: number
  duration: number
  persistent: boolean
  closable: boolean
  actions: ToastAction[]
  metadata: Record<string, any>
}

export interface ToastOptions {
  duration?: number
  persistent?: boolean
  closable?: boolean
  actions?: ToastAction[]
  metadata?: Record<string, any>
}

// Clipboard types
export interface ClipboardInfo {
  method: 'clipboard-api' | 'exec-command'
  timestamp: number
}

export interface ClipboardStats {
  isSupported: boolean
  lastCopiedLength: number
  lastCopyTime: number | null
  recentlyCopied: boolean
  canCopy: boolean
}

export interface FallbackInstructions {
  shortcut: string
  instructions: string[]
  alternativeMethod: string
}

// Error handling types
export type ErrorType = 'monaco_init' | 'json_parse' | 'clipboard' | 'network' | 'unknown'
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorInfo {
  originalError: Error
  context: string
  message: string
  severity: ErrorSeverity
  type: ErrorType
}

export interface ErrorAction {
  label: string
  action: () => void
  primary?: boolean
}

// Component prop types
export interface EditorHeaderProps {
  isLoading: boolean
  isDiffMode: boolean
  canCopy: boolean
  canFormat: boolean
  isCopying: boolean
  isCompressing: boolean
  isFormatting: boolean
  isSwitchingMode: boolean
  loadingMessage: string
}

export interface LoadingSpinnerProps {
  size: 'small' | 'medium' | 'large' | 'extra-large'
  variant: 'primary' | 'secondary' | 'light' | 'dark'
  type: 'dots' | 'circle' | 'bars' | 'pulse'
  text: string
  showText: boolean
  overlay: boolean
  progress: number | null
  showProgress: boolean
  color: string
  speed: 'slow' | 'normal' | 'fast'
  ariaLabel: string
  ariaLive: 'polite' | 'assertive' | 'off'
}

export interface ToastNotificationProps {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  maxToasts: number
  pauseOnHover: boolean
}

// Composable return types
export interface MonacoEditorComposable {
  isLoading: Ref<boolean>
  isInitialized: Ref<boolean>
  isDiffMode: Ref<boolean>
  currentEditor: Ref<any>
  currentDiffEditor: Ref<any>
  initializeEditor: (container: HTMLElement, config?: Partial<EditorConfig>) => Promise<void>
  toggleDiffMode: (currentContent?: string) => Promise<void>
  getEditorContent: (editorType?: 'original' | 'modified') => string
  setEditorContent: (content: string, editorType?: 'original' | 'modified') => void
  formatEditorContent: (editorType?: 'original' | 'modified') => Promise<void>
  resizeEditor: () => void
  cleanup: () => Promise<void>
}

export interface JsonFormatterComposable {
  isFormatting: Ref<boolean>
  isValid: Ref<boolean>
  validationError: Ref<Error | null>
  lastFormattedContent: Ref<string>
  formatStats: Ref<FormatStats>
  hasValidationError: ComputedRef<boolean>
  canFormat: ComputedRef<boolean>
  validateJson: (jsonString: string) => JsonValidationResult
  formatJson: (jsonString: string, indentSize?: number, sortKeys?: boolean) => Promise<string | null>
  minifyJson: (jsonString: string) => Promise<string | null>
  prettyPrintJson: (jsonString: string, options?: any) => Promise<string | null>
  compareJson: (json1: string, json2: string) => Promise<JsonComparison | null>
  extractSchema: (jsonString: string) => Promise<any>
  debouncedFormat: (jsonString: string, callback: (result: string | null) => void) => void
  debouncedValidate: (jsonString: string) => void
  clearValidation: () => void
  reset: () => void
}

export interface ClipboardComposable {
  isSupported: Ref<boolean>
  isCopying: Ref<boolean>
  lastCopiedText: Ref<string>
  lastCopyTime: Ref<number | null>
  canCopy: ComputedRef<boolean>
  recentlyCopied: ComputedRef<boolean>
  copyText: (text: string, options?: any) => Promise<boolean>
  copyJson: (jsonText: string, options?: any) => Promise<boolean>
  readText: () => Promise<string | null>
  hasJsonContent: () => Promise<boolean>
  getPermissionStatus: () => Promise<string>
  requestPermission: () => Promise<boolean>
  getFallbackInstructions: () => FallbackInstructions
  clearState: () => void
  getStats: () => ClipboardStats
  checkSupport: () => boolean
}

export interface ToastComposable {
  toasts: Ref<Toast[]>
  visibleToasts: ComputedRef<Toast[]>
  hasToasts: ComputedRef<boolean>
  isPaused: Ref<boolean>
  addToast: (message: string, type?: ToastType, options?: ToastOptions) => number | null
  removeToast: (id: number) => void
  updateToast: (id: number, updates: Partial<Toast>) => void
  clearAll: () => void
  pauseTimers: () => void
  resumeTimers: () => void
  success: (message: string, options?: ToastOptions) => number | null
  error: (message: string, options?: ToastOptions) => number | null
  warning: (message: string, options?: ToastOptions) => number | null
  info: (message: string, options?: ToastOptions) => number | null
  showWithActions: (message: string, actions?: ToastAction[], options?: ToastOptions) => number | null
  confirm: (message: string, onConfirm: () => void, onCancel: () => void, options?: ToastOptions) => number | null
  getStats: () => any
  cleanup: () => void
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]
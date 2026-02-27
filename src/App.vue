<template>
  <div class="app">
    <AppHeader
      :is-copying="isCopying"
      :is-compressing="isCompressing"
      :is-diff-mode="isDiffMode"
      :can-copy="canCopy"
      :is-busy="isBusy"
      :is-light-theme="isLightTheme"
      @copy="copyContent"
      @compress="copyMinified"
      @toggle-diff="toggleDiffMode"
      @toggle-theme="toggleTheme"
    />
    <main>
      <div class="editor-container">
        <div class="shortcut-row" aria-label="Keyboard shortcuts">
          <span class="shortcut-chip"><kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd> Format</span>
          <span class="shortcut-chip"><kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> Minify & Copy</span>
          <span class="shortcut-chip"><kbd>Ctrl/Cmd</kbd> + <kbd>D</kbd> Compare</span>
        </div>
        <div class="editor-wrapper">
          <div ref="normalEditor" class="editor" :style="{ display: isDiffMode ? 'none' : 'block' }"></div>
          <div ref="diffEditorContainer" class="editor" :style="{ display: isDiffMode ? 'block' : 'none' }"></div>
        </div>
      </div>
    </main>
    <AppToast :toast="toast" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppToast from './components/AppToast.vue'
import { DEFAULT_JSON_CONTENT } from './constants/editorConfig.js'
import { useMonacoEditor } from './composables/useMonacoEditor.js'
import { useJsonFormatter } from './composables/useJsonFormatter.js'
import { useClipboard } from './composables/useClipboard.js'
import { useInlineToast } from './composables/useInlineToast.js'

const normalEditor = ref(null)
const diffEditorContainer = ref(null)
const isCopying = ref(false)
const isCompressing = ref(false)
const isLightTheme = ref(false)

const { toast, showToast, clearToast } = useInlineToast(3000)

const handleAppError = (errorInfo) => {
  showToast(errorInfo?.message || 'Unexpected error occurred', 'error')
}

const {
  isLoading,
  isInitialized,
  isDiffMode,
  initialize,
  toggleDiffMode,
  getCurrentContent,
  formatContent,
  resize
} = useMonacoEditor({ onError: handleAppError })

const { minifyJson } = useJsonFormatter({ onError: handleAppError })

const { copyText } = useClipboard({
  onError: handleAppError
})

const canCopy = computed(() => isInitialized.value)
const isBusy = computed(() => isLoading.value || isCopying.value || isCompressing.value)
const THEME_STORAGE_KEY = 'json-formatter-theme'

const applyTheme = (isLight) => {
  const theme = isLight ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', theme)
}

const initializeTheme = () => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    isLightTheme.value = storedTheme === 'light'
  } else {
    isLightTheme.value = window.matchMedia('(prefers-color-scheme: light)').matches
  }
  applyTheme(isLightTheme.value)
}

const toggleTheme = () => {
  isLightTheme.value = !isLightTheme.value
  applyTheme(isLightTheme.value)
  localStorage.setItem(THEME_STORAGE_KEY, isLightTheme.value ? 'light' : 'dark')
}

const copyContent = async () => {
  if (isBusy.value || !canCopy.value) return

  isCopying.value = true
  try {
    const copied = await copyText(getCurrentContent())
    if (copied) {
      showToast('Content copied to clipboard!')
    } else {
      showToast('Failed to copy content', 'error')
    }
  } finally {
    isCopying.value = false
  }
}

const copyMinified = async () => {
  if (isBusy.value || !canCopy.value) return

  isCompressing.value = true
  try {
    const minified = await minifyJson(getCurrentContent())
    if (!minified) return

    const copied = await copyText(minified)
    if (copied) {
      showToast('Minified JSON copied to clipboard!')
    } else {
      showToast('Failed to copy minified JSON', 'error')
    }
  } finally {
    isCompressing.value = false
  }
}

const formatJson = async () => {
  const result = await formatContent()
  if (result) {
    showToast('JSON formatted successfully!')
  }
}

const handleKeyboardShortcuts = (event) => {
  const targetTag = event.target?.tagName
  if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || event.target?.isContentEditable) {
    return
  }

  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    formatJson()
    return
  }

  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault()
    copyMinified()
    return
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault()
    toggleDiffMode()
  }
}

onMounted(async () => {
  initializeTheme()

  await initialize({
    normalEditorContainer: normalEditor.value,
    diffEditorContainer: diffEditorContainer.value,
    initialValue: DEFAULT_JSON_CONTENT
  })

  window.addEventListener('resize', resize)
  window.addEventListener('keydown', handleKeyboardShortcuts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', handleKeyboardShortcuts)
  clearToast()
})
</script>

<style>
.app {
  height: 100vh;
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 20% -10%, var(--bg-accent-soft), transparent 55%),
    radial-gradient(900px 500px at 100% 0%, var(--bg-accent-soft-2), transparent 50%),
    var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.app-header {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto minmax(320px, 1fr);
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-2xl);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(6px);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-center {
  text-align: center;
}

h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.02em;
  font-family: var(--font-family-display);
}

.header-subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.header-buttons {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

main {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  display: flex;
}

.editor-container {
  flex: 1;
  min-height: 0;
  padding: var(--space-xl) var(--space-2xl) var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.shortcut-row {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.shortcut-chip {
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  background: var(--bg-chip);
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  font-size: var(--font-size-xs);
}

kbd {
  font-family: var(--font-family-mono);
  border: 1px solid var(--border-secondary);
  border-bottom-width: 2px;
  border-radius: 0.35rem;
  padding: 0.1rem 0.35rem;
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.editor-wrapper {
  flex: 1;
  min-height: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-lg);
  transition: box-shadow var(--transition-normal), border-color var(--transition-normal);
}

.editor-wrapper:hover {
  box-shadow: var(--shadow-xl);
  border-color: var(--border-accent);
}

.editor {
  height: 100%;
  width: 100%;
}

button {
  padding: 0.55rem 0.9rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
  transition: background-color var(--transition-normal), color var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.button-content {
  position: relative;
  z-index: 2;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--text-on-primary);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--color-secondary-action);
  color: var(--text-primary);
  border-color: var(--border-secondary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-action-hover);
  border-color: var(--border-accent);
}

.btn-ghost {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border-color: var(--border-primary);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--bg-surface);
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.toast {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-xl);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-lg);
  color: white;
  font-weight: var(--font-weight-medium);
  z-index: var(--z-toast);
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.toast.success {
  background-color: var(--color-success);
}

.toast.error {
  background-color: var(--color-error);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive design */
@media (max-width: 1199px) and (min-width: 768px) {
  .app-header {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--space-md);
  }

  .header-left,
  .header-buttons {
    justify-content: center;
  }
}

@media (max-width: 767px) {
  .app-header {
    grid-template-columns: 1fr;
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .header-left,
  .header-buttons {
    justify-content: center;
  }

  button {
    width: auto;
  }

  .editor-container {
    padding: var(--space-md);
    gap: var(--space-sm);
  }

  .shortcut-row {
    display: none;
  }

  .editor-wrapper {
    min-height: 52vh;
  }

  .toast {
    top: var(--space-md);
    right: var(--space-md);
    left: var(--space-md);
    bottom: auto;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .header-buttons {
    width: 100%;
    justify-content: stretch;
    gap: 0.5rem;
  }

  button {
    flex: 1;
  }
}

.github-link {
  color: var(--text-secondary);
  opacity: 1;
  transition: color var(--transition-normal), border-color var(--transition-normal), background-color var(--transition-normal);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  background: var(--bg-chip);
  padding: 0.4rem 0.75rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.github-link:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
  background: var(--bg-surface);
}

.github-link svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 767px) {
  .github-link {
    margin-bottom: 0;
  }
}

.diff-btn {
  min-width: 90px;
}

.diff-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary-hover);
  color: var(--text-on-primary);
}

.theme-btn {
  padding: 0;
  min-width: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.theme-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.theme-icon svg {
  width: 1.1rem;
  height: 1.1rem;
}

button:focus-visible,
.github-link:focus-visible {
  outline: 2px solid var(--border-accent);
  outline-offset: 2px;
}
</style>

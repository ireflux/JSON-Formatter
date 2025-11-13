<template>
  <div class="app">
    <header>
      <a href="https://github.com/ireflux/JSON-Formatter" target="_blank" class="github-link" title="View on GitHub">
        <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
      </a>
      <h1>JSON Formatter</h1>
      <div class="header-buttons">
        <button @click="copyContent" class="copy-btn" :disabled="!canCopy">
          <span class="button-content">{{ isCopying ? 'Copying...' : 'Copy' }}</span>
        </button>
        <button @click="copyMinified" class="compress-copy-btn" :disabled="!canCopy">
          <span class="button-content">{{ isCompressing ? 'Compressing...' : 'Compress & Copy' }}</span>
        </button>
        <button @click="toggleDiffMode" class="diff-btn" :class="{ active: isDiffMode }" :disabled="isLoading">
          <span class="button-content">{{ isDiffMode ? 'Exit Diff' : 'Compare' }}</span>
        </button>
      </div>
    </header>
    <main>
      <div class="editor-container">
        <div class="editor-wrapper">
          <div ref="editor" class="editor"></div>
        </div>
      </div>
    </main>
    <transition name="fade">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import loader from '@monaco-editor/loader'
import { configureMonacoLoader } from './utils/monacoLoader.js'

try {
  configureMonacoLoader(loader)
} catch (e) {
  console.warn('Failed to configure Monaco loader path in App.vue', e)
}
import { BASE_EDITOR_CONFIG, DIFF_EDITOR_CONFIG, DEFAULT_JSON_CONTENT } from './constants/editorConfig.js'
import { debounce } from './utils/debounce.js'
import { handleError } from './utils/errorHandling.js'

const editor = ref(null)
let monacoEditor = null
let diffEditor = null
const isDiffMode = ref(false)
const isLoading = ref(false)
const isCopying = ref(false)
const isCompressing = ref(false)
const canCopy = ref(true)
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const createEditor = async () => {
  const monaco = await loader.init()
  return monaco.editor.create(editor.value, {
    ...BASE_EDITOR_CONFIG,
    value: DEFAULT_JSON_CONTENT
  })
}

const createDiffEditor = async () => {
  const monaco = await loader.init()
  return monaco.editor.createDiffEditor(editor.value, DIFF_EDITOR_CONFIG)
}

const toggleDiffMode = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  const monaco = await loader.init()
  
  if (isDiffMode.value) {
    // Switch back to normal editor
    if (diffEditor) {
      diffEditor.dispose()
      diffEditor = null
    }
    monacoEditor = await createEditor()
    // Removed auto-format on paste in diff mode switch
  } else {
    // Switch to diff editor
    let currentValue = DEFAULT_JSON_CONTENT
    if (monacoEditor) {
      currentValue = monacoEditor.getValue()
      monacoEditor.dispose()
      monacoEditor = null
    }
    diffEditor = await createDiffEditor()
    diffEditor.setModel({
      original: monaco.editor.createModel(currentValue, 'json'),
      modified: monaco.editor.createModel(currentValue, 'json')
    })
  }
  isDiffMode.value = !isDiffMode.value
  isLoading.value = false
}

// Keyboard shortcuts handler
const handleKeyboardShortcuts = (event) => {
  // Skip if user is typing in an input field
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }
  
  // Ctrl/Cmd + Enter: Format JSON
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    formatJson()
    return
  }
  
  // Ctrl/Cmd + Shift + C: Copy minified
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
    event.preventDefault()
    copyMinified()
    return
  }
  
  // Ctrl/Cmd + D: Toggle diff mode
  if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
    event.preventDefault()
    toggleDiffMode()
    return
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    monacoEditor = await createEditor()
    // Removed auto-format on paste to allow editing duplicate keys
    // Users can manually format with Ctrl/Cmd + Enter
  } catch (error) {
    console.error('Failed to initialize editor:', error)
    showToast('Failed to initialize editor', 'error')
  } finally {
    isLoading.value = false
  }
  
  // Add event listeners
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyboardShortcuts)
})

onBeforeUnmount(() => {
  if (monacoEditor) {
    monacoEditor.dispose()
  }
  if (diffEditor) {
    diffEditor.dispose()
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyboardShortcuts)
})

const handleResize = () => {
  if (monacoEditor) {
    monacoEditor.layout()
  }
  if (diffEditor) {
    diffEditor.layout()
  }
}

const formatJson = async () => {
  try {
    if (isDiffMode.value && diffEditor) {
      const originalValue = diffEditor.getOriginalEditor().getValue()
      const modifiedValue = diffEditor.getModifiedEditor().getValue()
      
      const originalJson = JSON.parse(originalValue)
      const modifiedJson = JSON.parse(modifiedValue)
      
      const formattedOriginal = JSON.stringify(originalJson, null, 4)
      const formattedModified = JSON.stringify(modifiedJson, null, 4)
      
      diffEditor.getOriginalEditor().executeEdits('format', [{
        range: diffEditor.getOriginalEditor().getModel().getFullModelRange(),
        text: formattedOriginal,
        forceMoveMarkers: true
      }])
      diffEditor.getModifiedEditor().executeEdits('format', [{
        range: diffEditor.getModifiedEditor().getModel().getFullModelRange(),
        text: formattedModified,
        forceMoveMarkers: true
      }])
    } else if (monacoEditor) {
      const currentValue = monacoEditor.getValue()
      const json = JSON.parse(currentValue)
      const formatted = JSON.stringify(json, null, 4)
      
      // Only format if the content actually changed after parse/stringify
      // This prevents losing duplicate keys during editing
      if (formatted !== currentValue) {
        monacoEditor.executeEdits('format', [{
          range: monacoEditor.getModel().getFullModelRange(),
          text: formatted,
          forceMoveMarkers: true
        }])
      }
    }
  } catch (error) {
    if (!error.message.includes('paste')) {
      showToast('Invalid JSON: ' + error.message, 'error')
    }
  }
}

// Create debounced version of formatJson for better performance
const debouncedFormatJson = debounce(formatJson, 300)

// Helper function to get current editor content
const getCurrentEditorContent = () => {
  return isDiffMode.value 
    ? diffEditor.getModifiedEditor().getValue()
    : monacoEditor.getValue()
}

// Helper function to copy text with fallback
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.setAttribute('readonly', '')
      
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch (fallbackError) {
      throw error
    }
  }
}

const copyContent = async () => {
  if (isCopying.value || !canCopy.value) return
  
  isCopying.value = true
  try {
    const content = getCurrentEditorContent()
    await copyToClipboard(content)
    showToast('Content copied to clipboard!')
  } catch (error) {
    showToast('Failed to copy: ' + error.message, 'error')
  } finally {
    isCopying.value = false
  }
}

const copyMinified = async () => {
  if (isCompressing.value || !canCopy.value) return
  
  isCompressing.value = true
  try {
    const content = getCurrentEditorContent()
    const json = JSON.parse(content)
    const minified = JSON.stringify(json)
    await copyToClipboard(minified)
    showToast('Minified JSON copied to clipboard!')
  } catch (error) {
    if (error.name === 'SyntaxError') {
      showToast('Invalid JSON: ' + error.message, 'error')
    } else {
      showToast('Failed to copy: ' + error.message, 'error')
    }
  } finally {
    isCompressing.value = false
  }
}
</script>

<style>
.app {
  max-width: 100%;
  margin: 0;
  padding: 0;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

header {
  text-align: center;
  padding: var(--space-md) var(--space-xl);
  position: relative;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 1px;
  font-family: 'Playfair Display', serif;
  background: linear-gradient(45deg, #fff, #a8c0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-buttons {
  position: absolute;
  right: var(--space-xl);
  display: flex;
  gap: var(--space-md);
}

main {
  flex: 1;
  overflow: hidden;
}

.editor-container {
  height: 100%;
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
}

.editor-wrapper {
  flex: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: var(--transition-slow);
}

.editor-wrapper:hover {
  box-shadow: var(--shadow-xl);
}

.editor {
  height: 100%;
  width: 100%;
}

button {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  transition: var(--transition-bounce);
  background-color: var(--color-primary);
  color: white;
  position: relative;
  overflow: hidden;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-content {
  position: relative;
  z-index: 1;
  transition: var(--transition-normal);
}

button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

button:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: var(--shadow-sm);
}

.copy-btn, .compress-copy-btn {
  background-color: var(--color-primary);
}

.copy-btn:hover:not(:disabled), .compress-copy-btn:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.toast {
  position: fixed;
  bottom: var(--space-xl);
  right: var(--space-xl);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: white;
  font-weight: var(--font-weight-medium);
  z-index: var(--z-toast);
  box-shadow: var(--shadow-lg);
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
  .header-buttons {
    right: 1.5rem;
  }
  
  button {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 767px) {
  .header-buttons {
    position: static;
    transform: none;
    justify-content: center;
    margin-top: 1rem;
  }
  
  header {
    padding: 1rem;
    flex-direction: column;
  }
  
  h1 {
    font-size: 1.3rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .editor-container {
    padding: 1rem;
  }
  
  .toast {
    bottom: 16px;
    right: 16px;
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .header-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  button {
    width: 100%;
  }
}

.github-link {
  position: absolute;
  left: var(--space-xl);
  color: var(--text-primary);
  opacity: 0.7;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
}

.github-link:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.github-link svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 767px) {
  .github-link {
    position: static;
    margin-bottom: var(--space-sm);
    order: 3;
  }
  
  .header-buttons {
    order: 2;
  }
  
  h1 {
    order: 1;
  }
}

.diff-btn {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
}

.diff-btn:hover:not(:disabled) {
  background-color: var(--bg-surface);
}

.diff-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary-hover);
}

.diff-btn.active:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}
</style>
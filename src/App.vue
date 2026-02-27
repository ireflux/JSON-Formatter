<template>
  <div class="app">
    <AppHeader
      :is-copying="isCopying"
      :is-compressing="isCompressing"
      :is-diff-mode="isDiffMode"
      :can-copy="canCopy"
      :is-busy="isBusy"
      @copy="copyContent"
      @compress="copyMinified"
      @toggle-diff="toggleDiffMode"
    />
    <main>
      <div class="editor-container">
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
  resize,
  cleanup
} = useMonacoEditor({ onError: handleAppError })

const { minifyJson } = useJsonFormatter({ onError: handleAppError })

const { copyText } = useClipboard({
  onError: handleAppError
})

const canCopy = computed(() => isInitialized.value)
const isBusy = computed(() => isLoading.value || isCopying.value || isCompressing.value)

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
  cleanup()
})
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

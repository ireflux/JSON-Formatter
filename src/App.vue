<template>
  <div class="app">
    <header>
      <h1>JSON Formatter</h1>
      <div class="header-buttons">
        <button @click="copyContent" class="copy-btn">
          <span class="button-content">Copy</span>
        </button>
        <button @click="copyMinified" class="compress-copy-btn">
          <span class="button-content">Compress & Copy</span>
        </button>
      </div>
      <a href="https://github.com/ireflux/JSON-Formatter" target="_blank" class="github-link" title="View on GitHub">
        <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
      </a>
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
import * as monaco from 'monaco-editor'

const editor = ref(null)
let monacoEditor = null
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

onMounted(() => {
  // Initialize Monaco Editor
  monacoEditor = monaco.editor.create(editor.value, {
    value: '{\n  "example": "json"\n}',
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineHeight: 20,
    padding: {
      top: 16,
      bottom: 16
    }
  })

  // Add paste event listener
  monacoEditor.onDidPaste(() => {
    setTimeout(() => {
      formatJson()
    }, 100)
  })

  // Handle window resize
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // Clean up
  if (monacoEditor) {
    monacoEditor.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (monacoEditor) {
    monacoEditor.layout()
  }
}

const formatJson = () => {
  try {
    const json = JSON.parse(monacoEditor.getValue())
    const formatted = JSON.stringify(json, null, 4)
    monacoEditor.setValue(formatted)
  } catch (error) {
    if (!error.message.includes('paste')) {
      showToast('Invalid JSON: ' + error.message, 'error')
    }
  }
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(monacoEditor.getValue())
    showToast('Content copied to clipboard!')
  } catch (error) {
    showToast('Failed to copy: ' + error.message, 'error')
  }
}

const copyMinified = async () => {
  try {
    const json = JSON.parse(monacoEditor.getValue())
    const minified = JSON.stringify(json)
    await navigator.clipboard.writeText(minified)
    showToast('Minified JSON copied to clipboard!')
  } catch (error) {
    showToast('Invalid JSON: ' + error.message, 'error')
  }
}
</script>

<style>
.app {
  max-width: 100%;
  margin: 0;
  padding: 0;
  height: 100vh;
  background-color: #1e1e1e;
  color: #fff;
  display: flex;
  flex-direction: column;
}

header {
  text-align: center;
  padding: 0.75rem 1.5rem;
  position: relative;
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #fff;
  font-weight: 600;
  letter-spacing: 1px;
  font-family: 'Playfair Display', serif;
  background: linear-gradient(45deg, #fff, #a8c0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-buttons {
  position: absolute;
  right: 1.5rem;
  display: flex;
  gap: 0.75rem;
}

main {
  flex: 1;
  overflow: hidden;
}

.editor-container {
  height: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.editor-wrapper {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.editor-wrapper:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.editor {
  height: 100%;
  width: 100%;
}

button {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #0e639c;
  color: white;
  position: relative;
  overflow: hidden;
}

.button-content {
  position: relative;
  z-index: 1;
  transition: transform 0.2s ease;
}

button:hover {
  background-color: #1177bb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.copy-btn, .compress-copy-btn {
  background-color: #0e639c;
}

.copy-btn:hover, .compress-copy-btn:hover {
  background-color: #1177bb;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background-color: #4CAF50;
}

.toast.error {
  background-color: #f44336;
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
  left: 1.5rem;
  color: #fff;
  opacity: 0.7;
  transition: all 0.2s ease;
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
    margin-top: 0.5rem;
  }
  
  header {
    flex-direction: column;
  }
}
</style>
<template>
  <header 
    class="editor-header"
    role="banner"
  >
    <!-- Logo/Title Section -->
    <div class="editor-header__brand">
      <h1 class="editor-header__title">
        JSON Formatter
      </h1>
    </div>
    
    <!-- Action Buttons -->
    <div 
      class="editor-header__actions"
      role="toolbar"
      aria-label="Editor actions"
    >
      <!-- Copy Button -->
      <button
        class="editor-header__button editor-header__button--copy"
        :disabled="isLoading || !canCopy"
        :aria-label="copyButtonLabel"
        @click="handleCopyClick"
        @keydown="handleKeydown($event, 'copy')"
      >
        <span class="editor-header__button-icon" aria-hidden="true">
          <CopyIcon v-if="!isCopying" />
          <LoadingIcon v-else />
        </span>
        <span class="editor-header__button-text">
          {{ isCopying ? 'Copying...' : 'Copy' }}
        </span>
      </button>
      
      <!-- Compress & Copy Button -->
      <button
        class="editor-header__button editor-header__button--compress"
        :disabled="isLoading || !canCopy"
        :aria-label="compressButtonLabel"
        @click="handleCompressClick"
        @keydown="handleKeydown($event, 'compress')"
      >
        <span class="editor-header__button-icon" aria-hidden="true">
          <CompressIcon v-if="!isCompressing" />
          <LoadingIcon v-else />
        </span>
        <span class="editor-header__button-text">
          {{ isCompressing ? 'Compressing...' : 'Compress & Copy' }}
        </span>
      </button>
      
      <!-- Diff Mode Toggle -->
      <button
        class="editor-header__button editor-header__button--diff"
        :class="{ 'editor-header__button--active': isDiffMode }"
        :disabled="isLoading"
        :aria-label="diffButtonLabel"
        :aria-pressed="isDiffMode"
        @click="handleDiffToggle"
        @keydown="handleKeydown($event, 'diff')"
      >
        <span class="editor-header__button-icon" aria-hidden="true">
          <DiffIcon v-if="!isSwitchingMode" />
          <LoadingIcon v-else />
        </span>
        <span class="editor-header__button-text">
          {{ getDiffButtonText() }}
        </span>
      </button>
      
      <!-- Format Button -->
      <button
        class="editor-header__button editor-header__button--format"
        :disabled="isLoading || !canFormat"
        :aria-label="formatButtonLabel"
        @click="handleFormatClick"
        @keydown="handleKeydown($event, 'format')"
      >
        <span class="editor-header__button-icon" aria-hidden="true">
          <FormatIcon v-if="!isFormatting" />
          <LoadingIcon v-else />
        </span>
        <span class="editor-header__button-text">
          {{ isFormatting ? 'Formatting...' : 'Format' }}
        </span>
      </button>
    </div>
    
    <!-- GitHub Link -->
    <div class="editor-header__external">
      <a
        href="https://github.com/ireflux/JSON-Formatter"
        target="_blank"
        rel="noopener noreferrer"
        class="editor-header__github-link"
        :aria-label="githubLinkLabel"
      >
        <GitHubIcon />
        <span class="sr-only">View on GitHub</span>
      </a>
    </div>
    
    <!-- Loading Indicator -->
    <div 
      v-if="isLoading"
      class="editor-header__loading"
      role="status"
      aria-live="polite"
      :aria-label="loadingMessage"
    >
      <LoadingSpinner 
        size="small" 
        variant="light"
        :text="loadingMessage"
        :show-text="false"
      />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

// Props
const props = defineProps({
  // State props
  isLoading: {
    type: Boolean,
    default: false
  },
  
  isDiffMode: {
    type: Boolean,
    default: false
  },
  
  canCopy: {
    type: Boolean,
    default: true
  },
  
  canFormat: {
    type: Boolean,
    default: true
  },
  
  // Operation states
  isCopying: {
    type: Boolean,
    default: false
  },
  
  isCompressing: {
    type: Boolean,
    default: false
  },
  
  isFormatting: {
    type: Boolean,
    default: false
  },
  
  isSwitchingMode: {
    type: Boolean,
    default: false
  },
  
  // Loading message
  loadingMessage: {
    type: String,
    default: 'Loading editor...'
  }
})

// Emits
const emit = defineEmits([
  'copy',
  'compress',
  'toggle-diff',
  'format'
])

// Computed properties
const copyButtonLabel = computed(() => {
  if (props.isCopying) return 'Copying content to clipboard'
  if (!props.canCopy) return 'Copy not available'
  return 'Copy formatted JSON to clipboard'
})

const compressButtonLabel = computed(() => {
  if (props.isCompressing) return 'Compressing and copying content'
  if (!props.canCopy) return 'Compress and copy not available'
  return 'Compress JSON and copy to clipboard'
})

const diffButtonLabel = computed(() => {
  if (props.isSwitchingMode) return 'Switching editor mode'
  return props.isDiffMode ? 'Exit diff mode' : 'Enter diff mode to compare JSON'
})

const formatButtonLabel = computed(() => {
  if (props.isFormatting) return 'Formatting JSON content'
  if (!props.canFormat) return 'Format not available'
  return 'Format JSON with proper indentation'
})

const githubLinkLabel = computed(() => {
  return 'View JSON Formatter source code on GitHub (opens in new tab)'
})

// Methods
const getDiffButtonText = () => {
  if (props.isSwitchingMode) return 'Switching...'
  return props.isDiffMode ? 'Exit Diff' : 'Compare'
}

// Event handlers
const handleCopyClick = () => {
  if (!props.isLoading && props.canCopy && !props.isCopying) {
    emit('copy')
  }
}

const handleCompressClick = () => {
  if (!props.isLoading && props.canCopy && !props.isCompressing) {
    emit('compress')
  }
}

const handleDiffToggle = () => {
  if (!props.isLoading && !props.isSwitchingMode) {
    emit('toggle-diff')
  }
}

const handleFormatClick = () => {
  if (!props.isLoading && props.canFormat && !props.isFormatting) {
    emit('format')
  }
}

const handleKeydown = (event, action) => {
  // Handle Enter and Space key presses
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    
    switch (action) {
      case 'copy':
        handleCopyClick()
        break
      case 'compress':
        handleCompressClick()
        break
      case 'diff':
        handleDiffToggle()
        break
      case 'format':
        handleFormatClick()
        break
    }
  }
}

// Icon components (inline SVG for simplicity)
const CopyIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
    </svg>
  `
}

const CompressIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
      <path d="M6 4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z"/>
    </svg>
  `
}

const DiffIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
      <path d="M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
    </svg>
  `
}

const FormatIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-11zm0-1h11A1.5 1.5 0 0 1 15 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 14.5v-13A1.5 1.5 0 0 1 2.5 0z"/>
      <path d="M4.5 3a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7zM4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7zM4 9.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/>
    </svg>
  `
}

const GitHubIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  `
}

const LoadingIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="loading-icon">
      <path d="M8 0a8 8 0 0 1 7.75 6h-1.51a6.5 6.5 0 1 0-1.32 4.24l.75 1.3A8 8 0 1 1 8 0z"/>
    </svg>
  `
}

// Register icon components
const components = {
  CopyIcon,
  CompressIcon,
  DiffIcon,
  FormatIcon,
  GitHubIcon,
  LoadingIcon
}
</script>

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  min-height: 4rem;
}

.editor-header__brand {
  flex-shrink: 0;
}

.editor-header__title {
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

.editor-header__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.editor-header__button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #0e639c;
  color: white;
  position: relative;
  overflow: hidden;
  min-width: 2.5rem;
  justify-content: center;
}

.editor-header__button:hover:not(:disabled) {
  background-color: #1177bb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.editor-header__button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.editor-header__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.editor-header__button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.editor-header__button--diff {
  background-color: #2d2d2d;
  border: 1px solid #3c3c3c;
}

.editor-header__button--diff:hover:not(:disabled) {
  background-color: #3d3d3d;
}

.editor-header__button--diff.editor-header__button--active {
  background-color: #0e639c;
  border-color: #1177bb;
}

.editor-header__button--diff.editor-header__button--active:hover:not(:disabled) {
  background-color: #1177bb;
}

.editor-header__button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.editor-header__button-text {
  white-space: nowrap;
}

.editor-header__external {
  flex-shrink: 0;
}

.editor-header__github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: #fff;
  opacity: 0.7;
  transition: all 0.2s ease;
  border-radius: 0.375rem;
  text-decoration: none;
}

.editor-header__github-link:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.editor-header__github-link:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.editor-header__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

/* Loading animation */
.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive design */
@media (max-width: 1024px) {
  .editor-header {
    padding: 0.75rem 1rem;
  }
  
  .editor-header__actions {
    gap: 0.5rem;
  }
  
  .editor-header__button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    min-height: auto;
  }
  
  .editor-header__title {
    font-size: 1.5rem;
  }
  
  .editor-header__actions {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .editor-header__button {
    flex: 1;
    min-width: 120px;
  }
  
  .editor-header__external {
    order: -1;
  }
}

@media (max-width: 480px) {
  .editor-header__actions {
    flex-direction: column;
    width: 100%;
  }
  
  .editor-header__button {
    width: 100%;
    justify-content: center;
  }
  
  .editor-header__button-text {
    display: block;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .editor-header {
    border-bottom: 2px solid #fff;
  }
  
  .editor-header__button {
    border: 2px solid currentColor;
  }
  
  .editor-header__github-link {
    border: 1px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .editor-header__button,
  .editor-header__github-link {
    transition: none;
  }
  
  .editor-header__button:hover:not(:disabled),
  .editor-header__github-link:hover {
    transform: none;
  }
  
  .loading-icon {
    animation: none;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .editor-header {
    background-color: #1a1a1a;
    border-bottom-color: #333;
  }
}
</style>
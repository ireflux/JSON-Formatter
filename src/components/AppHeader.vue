<template>
  <header class="app-header">
    <div class="header-left">
      <a href="https://github.com/ireflux/JSON-Formatter" target="_blank" rel="noopener noreferrer" class="github-link" title="View on GitHub">
        <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        <span>Source</span>
      </a>
    </div>

    <div class="header-center">
      <h1>JSON Formatter</h1>
      <p class="header-subtitle">Format, compare, and minify JSON quickly</p>
    </div>

    <div class="header-buttons">
      <button @click="$emit('copy')" class="copy-btn btn-primary" :disabled="!canCopy || isBusy">
        <span class="button-content">{{ isCopying ? 'Copying...' : 'Copy JSON' }}</span>
      </button>
      <button @click="$emit('compress')" class="compress-copy-btn btn-secondary" :disabled="!canCopy || isBusy">
        <span class="button-content">{{ isCompressing ? 'Compressing...' : 'Minify & Copy' }}</span>
      </button>
      <button @click="$emit('toggle-diff')" class="diff-btn btn-ghost" :class="{ active: isDiffMode }" :disabled="isBusy" :aria-pressed="isDiffMode">
        <span class="button-content">{{ isDiffMode ? 'Exit Diff' : 'Compare' }}</span>
      </button>
      <button
        @click="$emit('toggle-theme')"
        class="theme-btn btn-ghost"
        :aria-pressed="isLightTheme"
        :aria-label="isLightTheme ? 'Switch to dark theme' : 'Switch to light theme'"
        :title="isLightTheme ? 'Switch to dark theme' : 'Switch to light theme'"
      >
        <span class="button-content theme-icon" aria-hidden="true">
          <svg v-if="isLightTheme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"></path>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>
          </svg>
        </span>
        <span class="sr-only">{{ isLightTheme ? 'Switch to dark theme' : 'Switch to light theme' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  isCopying: {
    type: Boolean,
    default: false
  },
  isCompressing: {
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
  isBusy: {
    type: Boolean,
    default: false
  },
  isLightTheme: {
    type: Boolean,
    default: false
  }
})

defineEmits(['copy', 'compress', 'toggle-diff', 'toggle-theme'])
</script>

<template>
  <div 
    class="loading-spinner"
    :class="[
      `loading-spinner--${size}`,
      `loading-spinner--${variant}`,
      { 'loading-spinner--overlay': overlay }
    ]"
    :aria-label="ariaLabel"
    role="status"
    :aria-live="ariaLive"
  >
    <!-- Overlay background -->
    <div 
      v-if="overlay" 
      class="loading-spinner__overlay"
      @click="handleOverlayClick"
    ></div>
    
    <!-- Spinner container -->
    <div class="loading-spinner__container">
      <!-- Spinner -->
      <div 
        class="loading-spinner__spinner"
        :style="spinnerStyles"
      >
        <component :is="spinnerComponent" />
      </div>
      
      <!-- Loading text -->
      <div 
        v-if="showText && text"
        class="loading-spinner__text"
      >
        {{ text }}
      </div>
      
      <!-- Progress indicator -->
      <div 
        v-if="showProgress && progress !== null"
        class="loading-spinner__progress"
      >
        <div class="loading-spinner__progress-bar">
          <div 
            class="loading-spinner__progress-fill"
            :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
          ></div>
        </div>
        <div class="loading-spinner__progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  // Size variants
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'extra-large'].includes(value)
  },
  
  // Visual variants
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'light', 'dark'].includes(value)
  },
  
  // Spinner type
  type: {
    type: String,
    default: 'dots',
    validator: (value) => ['dots', 'circle', 'bars', 'pulse'].includes(value)
  },
  
  // Loading text
  text: {
    type: String,
    default: ''
  },
  
  // Show/hide text
  showText: {
    type: Boolean,
    default: true
  },
  
  // Overlay mode
  overlay: {
    type: Boolean,
    default: false
  },
  
  // Progress value (0-100)
  progress: {
    type: Number,
    default: null,
    validator: (value) => value === null || (value >= 0 && value <= 100)
  },
  
  // Show progress bar
  showProgress: {
    type: Boolean,
    default: false
  },
  
  // Custom color
  color: {
    type: String,
    default: ''
  },
  
  // Animation speed
  speed: {
    type: String,
    default: 'normal',
    validator: (value) => ['slow', 'normal', 'fast'].includes(value)
  },
  
  // Accessibility
  ariaLabel: {
    type: String,
    default: 'Loading'
  },
  
  ariaLive: {
    type: String,
    default: 'polite',
    validator: (value) => ['polite', 'assertive', 'off'].includes(value)
  }
})

// Emits
const emit = defineEmits(['overlay-click'])

// Computed properties
const spinnerComponent = computed(() => {
  const components = {
    dots: 'DotsSpinner',
    circle: 'CircleSpinner',
    bars: 'BarsSpinner',
    pulse: 'PulseSpinner'
  }
  return components[props.type] || 'DotsSpinner'
})

const spinnerStyles = computed(() => {
  const styles = {}
  
  if (props.color) {
    styles.color = props.color
  }
  
  const speedMap = {
    slow: '2s',
    normal: '1.5s',
    fast: '1s'
  }
  
  styles.animationDuration = speedMap[props.speed]
  
  return styles
})

// Event handlers
const handleOverlayClick = (event) => {
  emit('overlay-click', event)
}

// Spinner components
const DotsSpinner = {
  template: `
    <div class="dots-spinner">
      <div class="dots-spinner__dot"></div>
      <div class="dots-spinner__dot"></div>
      <div class="dots-spinner__dot"></div>
    </div>
  `
}

const CircleSpinner = {
  template: `
    <svg class="circle-spinner" viewBox="0 0 50 50">
      <circle
        class="circle-spinner__path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-dasharray="31.416"
        stroke-dashoffset="31.416"
      />
    </svg>
  `
}

const BarsSpinner = {
  template: `
    <div class="bars-spinner">
      <div class="bars-spinner__bar"></div>
      <div class="bars-spinner__bar"></div>
      <div class="bars-spinner__bar"></div>
      <div class="bars-spinner__bar"></div>
      <div class="bars-spinner__bar"></div>
    </div>
  `
}

const PulseSpinner = {
  template: `
    <div class="pulse-spinner">
      <div class="pulse-spinner__ring"></div>
      <div class="pulse-spinner__ring"></div>
    </div>
  `
}

// Register spinner components
const components = {
  DotsSpinner,
  CircleSpinner,
  BarsSpinner,
  PulseSpinner
}
</script>

<style scoped>
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading-spinner--overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.loading-spinner__container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-spinner--overlay .loading-spinner__container {
  background: rgba(255, 255, 255, 0.98);
}

/* Size variants */
.loading-spinner--small .loading-spinner__spinner {
  width: 1.5rem;
  height: 1.5rem;
}

.loading-spinner--medium .loading-spinner__spinner {
  width: 2rem;
  height: 2rem;
}

.loading-spinner--large .loading-spinner__spinner {
  width: 3rem;
  height: 3rem;
}

.loading-spinner--extra-large .loading-spinner__spinner {
  width: 4rem;
  height: 4rem;
}

/* Color variants */
.loading-spinner--primary {
  color: #3b82f6;
}

.loading-spinner--secondary {
  color: #6b7280;
}

.loading-spinner--light {
  color: #f9fafb;
}

.loading-spinner--dark {
  color: #1f2937;
}

.loading-spinner--light .loading-spinner__container {
  background: rgba(31, 41, 55, 0.95);
  color: #f9fafb;
}

.loading-spinner__text {
  font-size: 0.875rem;
  font-weight: 500;
  color: inherit;
  text-align: center;
  margin: 0;
}

.loading-spinner--small .loading-spinner__text {
  font-size: 0.75rem;
}

.loading-spinner--large .loading-spinner__text {
  font-size: 1rem;
}

.loading-spinner--extra-large .loading-spinner__text {
  font-size: 1.125rem;
}

/* Progress indicator */
.loading-spinner__progress {
  width: 100%;
  min-width: 200px;
}

.loading-spinner__progress-bar {
  width: 100%;
  height: 0.5rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.25rem;
  overflow: hidden;
}

.loading-spinner__progress-fill {
  height: 100%;
  background: currentColor;
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.loading-spinner__progress-text {
  text-align: center;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  color: inherit;
}

/* Dots Spinner */
.dots-spinner {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.dots-spinner__dot {
  width: 0.5rem;
  height: 0.5rem;
  background: currentColor;
  border-radius: 50%;
  animation: dots-bounce 1.5s ease-in-out infinite;
}

.dots-spinner__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dots-spinner__dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dots-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Circle Spinner */
.circle-spinner {
  width: 100%;
  height: 100%;
  animation: circle-rotate 2s linear infinite;
}

.circle-spinner__path {
  animation: circle-dash 1.5s ease-in-out infinite;
}

@keyframes circle-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes circle-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* Bars Spinner */
.bars-spinner {
  display: flex;
  gap: 0.125rem;
  align-items: center;
  height: 100%;
}

.bars-spinner__bar {
  width: 0.25rem;
  height: 100%;
  background: currentColor;
  border-radius: 0.125rem;
  animation: bars-scale 1.2s ease-in-out infinite;
}

.bars-spinner__bar:nth-child(1) {
  animation-delay: -1.1s;
}

.bars-spinner__bar:nth-child(2) {
  animation-delay: -1s;
}

.bars-spinner__bar:nth-child(3) {
  animation-delay: -0.9s;
}

.bars-spinner__bar:nth-child(4) {
  animation-delay: -0.8s;
}

.bars-spinner__bar:nth-child(5) {
  animation-delay: -0.7s;
}

@keyframes bars-scale {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* Pulse Spinner */
.pulse-spinner {
  position: relative;
  width: 100%;
  height: 100%;
}

.pulse-spinner__ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0.125rem solid currentColor;
  border-radius: 50%;
  opacity: 1;
  animation: pulse-scale 2s ease-in-out infinite;
}

.pulse-spinner__ring:nth-child(2) {
  animation-delay: -1s;
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .loading-spinner__container {
    padding: 1rem;
  }
  
  .loading-spinner__progress {
    min-width: 150px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .loading-spinner__container {
    background: rgba(31, 41, 55, 0.95);
    color: #f9fafb;
  }
  
  .loading-spinner__overlay {
    background: rgba(0, 0, 0, 0.7);
  }
  
  .loading-spinner__progress-bar {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .dots-spinner__dot,
  .circle-spinner,
  .circle-spinner__path,
  .bars-spinner__bar,
  .pulse-spinner__ring {
    animation: none;
  }
  
  .dots-spinner__dot {
    opacity: 0.8;
  }
  
  .circle-spinner__path {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
  }
  
  .bars-spinner__bar {
    transform: scaleY(0.7);
  }
  
  .pulse-spinner__ring {
    opacity: 0.6;
  }
  
  .pulse-spinner__ring:nth-child(2) {
    opacity: 0.3;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .loading-spinner__container {
    border: 2px solid currentColor;
  }
  
  .loading-spinner__progress-bar {
    border: 1px solid currentColor;
  }
}
</style>
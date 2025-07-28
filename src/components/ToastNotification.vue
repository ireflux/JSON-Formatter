<template>
  <teleport to="body">
    <div 
      v-if="hasToasts"
      class="toast-container"
      :class="[`toast-container--${position}`]"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <transition-group
        name="toast"
        tag="div"
        class="toast-list"
        @enter="onEnter"
        @leave="onLeave"
      >
        <div
          v-for="toast in visibleToasts"
          :key="toast.id"
          class="toast"
          :class="[
            `toast--${toast.type}`,
            { 'toast--closable': toast.closable }
          ]"
          role="alert"
          :aria-describedby="`toast-message-${toast.id}`"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
          @click="handleToastClick(toast)"
        >
          <!-- Toast Icon -->
          <div class="toast__icon" aria-hidden="true">
            <component :is="getIconComponent(toast.type)" />
          </div>
          
          <!-- Toast Content -->
          <div class="toast__content">
            <div 
              :id="`toast-message-${toast.id}`"
              class="toast__message"
            >
              {{ toast.message }}
            </div>
            
            <!-- Toast Actions -->
            <div 
              v-if="toast.actions && toast.actions.length > 0"
              class="toast__actions"
            >
              <button
                v-for="(action, index) in toast.actions"
                :key="index"
                class="toast__action"
                :class="{ 'toast__action--primary': action.primary }"
                @click.stop="handleActionClick(action, toast)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
          
          <!-- Close Button -->
          <button
            v-if="toast.closable"
            class="toast__close"
            type="button"
            :aria-label="`Close notification: ${toast.message}`"
            @click.stop="handleCloseClick(toast)"
          >
            <CloseIcon />
          </button>
          
          <!-- Progress Bar -->
          <div
            v-if="!toast.persistent && toast.duration > 0"
            class="toast__progress"
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useToast } from '../composables/useToast.js'

// Props
const props = defineProps({
  position: {
    type: String,
    default: 'bottom-right',
    validator: (value) => [
      'top-left', 'top-center', 'top-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ].includes(value)
  },
  maxToasts: {
    type: Number,
    default: 5
  },
  pauseOnHover: {
    type: Boolean,
    default: true
  }
})

// Composable
const { 
  visibleToasts, 
  hasToasts, 
  removeToast, 
  pauseTimers, 
  resumeTimers 
} = useToast({
  maxToasts: props.maxToasts
})

// Event handlers
const handleMouseEnter = () => {
  if (props.pauseOnHover) {
    pauseTimers()
  }
}

const handleMouseLeave = () => {
  if (props.pauseOnHover) {
    resumeTimers()
  }
}

const handleToastClick = (toast) => {
  if (toast.closeOnClick !== false) {
    removeToast(toast.id)
  }
}

const handleCloseClick = (toast) => {
  removeToast(toast.id)
}

const handleActionClick = (action, toast) => {
  if (typeof action.action === 'function') {
    action.action(toast)
  }
}

// Animation handlers
const onEnter = (el) => {
  el.style.opacity = '0'
  el.style.transform = getEnterTransform()
  
  // Force reflow
  el.offsetHeight
  
  el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  el.style.opacity = '1'
  el.style.transform = 'translateX(0) translateY(0) scale(1)'
}

const onLeave = (el) => {
  el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  el.style.opacity = '0'
  el.style.transform = getLeaveTransform()
}

const getEnterTransform = () => {
  const transforms = {
    'top-right': 'translateX(100%) scale(0.95)',
    'top-left': 'translateX(-100%) scale(0.95)',
    'top-center': 'translateY(-100%) scale(0.95)',
    'bottom-right': 'translateX(100%) scale(0.95)',
    'bottom-left': 'translateX(-100%) scale(0.95)',
    'bottom-center': 'translateY(100%) scale(0.95)'
  }
  return transforms[props.position] || 'translateX(100%) scale(0.95)'
}

const getLeaveTransform = () => {
  const transforms = {
    'top-right': 'translateX(100%) scale(0.95)',
    'top-left': 'translateX(-100%) scale(0.95)',
    'top-center': 'translateY(-100%) scale(0.95)',
    'bottom-right': 'translateX(100%) scale(0.95)',
    'bottom-left': 'translateX(-100%) scale(0.95)',
    'bottom-center': 'translateY(100%) scale(0.95)'
  }
  return transforms[props.position] || 'translateX(100%) scale(0.95)'
}

// Icon components
const getIconComponent = (type) => {
  const icons = {
    success: 'CheckIcon',
    error: 'ErrorIcon',
    warning: 'WarningIcon',
    info: 'InfoIcon'
  }
  return icons[type] || 'InfoIcon'
}

// Icon components (inline SVG for simplicity)
const CheckIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
  `
}

const ErrorIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `
}

const WarningIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `
}

const InfoIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>
  `
}

const CloseIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
    </svg>
  `
}

// Register icon components
const components = {
  CheckIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon,
  CloseIcon
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

/* Position variants */
.toast-container--top-left {
  top: 1rem;
  left: 1rem;
}

.toast-container--top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-container--top-right {
  top: 1rem;
  right: 1rem;
}

.toast-container--bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.toast-container--bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-container--bottom-right {
  bottom: 1rem;
  right: 1rem;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  min-height: 3.5rem;
  max-width: 100%;
  word-wrap: break-word;
}

.toast--closable {
  cursor: pointer;
}

.toast--success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.toast--success .toast__icon {
  color: #10b981;
}

.toast--error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.toast--error .toast__icon {
  color: #ef4444;
}

.toast--warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.toast--warning .toast__icon {
  color: #f59e0b;
}

.toast--info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.toast--info .toast__icon {
  color: #3b82f6;
}

.toast__icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  margin: 0;
}

.toast__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.toast__action {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toast__action:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.toast__action--primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.toast__action--primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.toast__close {
  flex-shrink: 0;
  padding: 0.25rem;
  margin: -0.25rem -0.25rem -0.25rem 0;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.toast__close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.toast__close:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: toast-progress linear forwards;
  transform-origin: left;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .toast-container {
    left: 1rem !important;
    right: 1rem !important;
    max-width: none;
    transform: none !important;
  }
  
  .toast {
    padding: 0.875rem;
  }
  
  .toast__message {
    font-size: 0.8125rem;
  }
  
  .toast__actions {
    flex-direction: column;
  }
  
  .toast__action {
    width: 100%;
    justify-content: center;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .toast {
    background: #1f2937;
    color: #f9fafb;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .toast--success {
    background: #064e3b;
  }
  
  .toast--error {
    background: #7f1d1d;
  }
  
  .toast--warning {
    background: #78350f;
  }
  
  .toast--info {
    background: #1e3a8a;
  }
  
  .toast__message {
    color: #f9fafb;
  }
  
  .toast__action {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .toast__action:hover {
    background: #4b5563;
    border-color: #6b7280;
  }
  
  .toast__close {
    color: #9ca3af;
  }
  
  .toast__close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f9fafb;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .toast {
    transition: none;
  }
  
  .toast__progress {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .toast {
    border: 2px solid;
  }
  
  .toast--success {
    border-color: #10b981;
  }
  
  .toast--error {
    border-color: #ef4444;
  }
  
  .toast--warning {
    border-color: #f59e0b;
  }
  
  .toast--info {
    border-color: #3b82f6;
  }
}
</style>
/**
 * Toast notification composable
 * Manages toast notifications with proper cleanup and accessibility
 */

import { ref, computed, onBeforeUnmount } from 'vue'

/**
 * Toast types
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * Default toast configuration
 */
const DEFAULT_CONFIG = {
  duration: 3000,
  position: 'bottom-right',
  maxToasts: 5,
  pauseOnHover: true,
  closeOnClick: true
}

/**
 * Toast composable
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Toast management functions and state
 */
export function useToast(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }
  
  // Reactive state
  const toasts = ref([])
  const nextId = ref(1)
  const isPaused = ref(false)
  
  // Active timers for cleanup
  const activeTimers = new Map()
  
  // Computed properties
  const visibleToasts = computed(() => 
    toasts.value.filter(toast => toast.visible)
  )
  
  const hasToasts = computed(() => visibleToasts.value.length > 0)
  
  /**
   * Generate unique toast ID
   * 
   * @returns {number} Unique ID
   */
  const generateId = () => {
    return nextId.value++
  }
  
  /**
   * Create a new toast object
   * 
   * @param {string} message - Toast message
   * @param {string} type - Toast type
   * @param {Object} options - Toast options
   * @returns {Object} Toast object
   */
  const createToast = (message, type = TOAST_TYPES.INFO, toastOptions = {}) => {
    const id = generateId()
    const timestamp = Date.now()
    
    return {
      id,
      message,
      type,
      visible: true,
      timestamp,
      duration: toastOptions.duration ?? config.duration,
      persistent: toastOptions.persistent ?? false,
      closable: toastOptions.closable ?? true,
      actions: toastOptions.actions ?? [],
      metadata: toastOptions.metadata ?? {}
    }
  }
  
  /**
   * Add a new toast notification
   * 
   * @param {string} message - Toast message
   * @param {string} type - Toast type
   * @param {Object} options - Toast options
   * @returns {number} Toast ID
   */
  const addToast = (message, type = TOAST_TYPES.INFO, options = {}) => {
    if (!message || typeof message !== 'string') {
      console.warn('Toast message must be a non-empty string')
      return null
    }
    
    const toast = createToast(message, type, options)
    
    // Remove oldest toast if we exceed the maximum
    if (toasts.value.length >= config.maxToasts) {
      const oldestToast = toasts.value[0]
      removeToast(oldestToast.id)
    }
    
    // Add new toast
    toasts.value.push(toast)
    
    // Set up auto-dismiss timer if not persistent
    if (!toast.persistent && toast.duration > 0) {
      scheduleRemoval(toast.id, toast.duration)
    }
    
    // Announce to screen readers
    announceToScreenReader(message, type)
    
    return toast.id
  }
  
  /**
   * Remove a toast by ID
   * 
   * @param {number} id - Toast ID
   */
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    
    if (index !== -1) {
      // Clear any active timer
      clearTimer(id)
      
      // Mark as not visible for transition
      toasts.value[index].visible = false
      
      // Remove from array after transition
      setTimeout(() => {
        const currentIndex = toasts.value.findIndex(toast => toast.id === id)
        if (currentIndex !== -1) {
          toasts.value.splice(currentIndex, 1)
        }
      }, 300) // Match CSS transition duration
    }
  }
  
  /**
   * Schedule toast removal
   * 
   * @param {number} id - Toast ID
   * @param {number} duration - Duration in milliseconds
   */
  const scheduleRemoval = (id, duration) => {
    const timerId = setTimeout(() => {
      if (!isPaused.value) {
        removeToast(id)
      } else {
        // Reschedule if paused
        scheduleRemoval(id, duration)
      }
    }, duration)
    
    activeTimers.set(id, timerId)
  }
  
  /**
   * Clear timer for a toast
   * 
   * @param {number} id - Toast ID
   */
  const clearTimer = (id) => {
    const timerId = activeTimers.get(id)
    if (timerId) {
      clearTimeout(timerId)
      activeTimers.delete(id)
    }
  }
  
  /**
   * Pause all toast timers
   */
  const pauseTimers = () => {
    isPaused.value = true
  }
  
  /**
   * Resume all toast timers
   */
  const resumeTimers = () => {
    isPaused.value = false
  }
  
  /**
   * Clear all toasts
   */
  const clearAll = () => {
    // Clear all timers
    activeTimers.forEach((timerId) => {
      clearTimeout(timerId)
    })
    activeTimers.clear()
    
    // Mark all toasts as not visible
    toasts.value.forEach(toast => {
      toast.visible = false
    })
    
    // Clear array after transition
    setTimeout(() => {
      toasts.value = []
    }, 300)
  }
  
  /**
   * Update an existing toast
   * 
   * @param {number} id - Toast ID
   * @param {Object} updates - Updates to apply
   */
  const updateToast = (id, updates) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast) {
      Object.assign(toast, updates)
      
      // Reschedule removal if duration changed
      if (updates.duration !== undefined && !toast.persistent) {
        clearTimer(id)
        scheduleRemoval(id, updates.duration)
      }
    }
  }
  
  /**
   * Announce toast to screen readers
   * 
   * @param {string} message - Message to announce
   * @param {string} type - Toast type
   */
  const announceToScreenReader = (message, type) => {
    // Create temporary element for screen reader announcement
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', type === TOAST_TYPES.ERROR ? 'assertive' : 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    
    // Add type prefix for context
    const typePrefix = {
      [TOAST_TYPES.SUCCESS]: 'Success: ',
      [TOAST_TYPES.ERROR]: 'Error: ',
      [TOAST_TYPES.WARNING]: 'Warning: ',
      [TOAST_TYPES.INFO]: 'Info: '
    }[type] || ''
    
    announcement.textContent = typePrefix + message
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement)
      }
    }, 1000)
  }
  
  /**
   * Convenience methods for different toast types
   */
  const success = (message, options = {}) => {
    return addToast(message, TOAST_TYPES.SUCCESS, options)
  }
  
  const error = (message, options = {}) => {
    return addToast(message, TOAST_TYPES.ERROR, {
      duration: 5000, // Longer duration for errors
      ...options
    })
  }
  
  const warning = (message, options = {}) => {
    return addToast(message, TOAST_TYPES.WARNING, options)
  }
  
  const info = (message, options = {}) => {
    return addToast(message, TOAST_TYPES.INFO, options)
  }
  
  /**
   * Show a toast with action buttons
   * 
   * @param {string} message - Toast message
   * @param {Array} actions - Array of action objects
   * @param {Object} options - Toast options
   * @returns {number} Toast ID
   */
  const showWithActions = (message, actions = [], options = {}) => {
    return addToast(message, TOAST_TYPES.INFO, {
      ...options,
      actions,
      persistent: true, // Don't auto-dismiss toasts with actions
      closable: true
    })
  }
  
  /**
   * Show a confirmation toast
   * 
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Confirmation callback
   * @param {Function} onCancel - Cancel callback
   * @param {Object} options - Toast options
   * @returns {number} Toast ID
   */
  const confirm = (message, onConfirm, onCancel, options = {}) => {
    const actions = [
      {
        label: 'Confirm',
        action: () => {
          onConfirm && onConfirm()
          removeToast(toastId)
        },
        primary: true
      },
      {
        label: 'Cancel',
        action: () => {
          onCancel && onCancel()
          removeToast(toastId)
        }
      }
    ]
    
    const toastId = showWithActions(message, actions, {
      type: TOAST_TYPES.WARNING,
      ...options
    })
    
    return toastId
  }
  
  /**
   * Get toast statistics
   * 
   * @returns {Object} Toast statistics
   */
  const getStats = () => {
    return {
      total: toasts.value.length,
      visible: visibleToasts.value.length,
      byType: {
        success: toasts.value.filter(t => t.type === TOAST_TYPES.SUCCESS).length,
        error: toasts.value.filter(t => t.type === TOAST_TYPES.ERROR).length,
        warning: toasts.value.filter(t => t.type === TOAST_TYPES.WARNING).length,
        info: toasts.value.filter(t => t.type === TOAST_TYPES.INFO).length
      },
      activeTimers: activeTimers.size,
      isPaused: isPaused.value
    }
  }
  
  /**
   * Cleanup function
   */
  const cleanup = () => {
    // Clear all timers
    activeTimers.forEach((timerId) => {
      clearTimeout(timerId)
    })
    activeTimers.clear()
    
    // Clear toasts
    toasts.value = []
    isPaused.value = false
  }
  
  // Cleanup on component unmount
  onBeforeUnmount(cleanup)
  
  return {
    // State
    toasts,
    visibleToasts,
    hasToasts,
    isPaused,
    
    // Methods
    addToast,
    removeToast,
    updateToast,
    clearAll,
    pauseTimers,
    resumeTimers,
    
    // Convenience methods
    success,
    error,
    warning,
    info,
    showWithActions,
    confirm,
    
    // Utilities
    getStats,
    cleanup
  }
}
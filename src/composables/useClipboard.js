/**
 * Clipboard composable
 * Handles clipboard operations with fallback mechanisms and error handling
 */

import { ref, computed } from 'vue'
import { handleError, createSafeAsyncWrapper } from '../utils/errorHandling.js'

/**
 * Clipboard composable
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onError - Error handler callback
 * @param {Function} options.onSuccess - Success callback
 * @returns {Object} Clipboard functions and state
 */
export function useClipboard(options = {}) {
  const { onError, onSuccess } = options
  
  // Reactive state
  const isSupported = ref(false)
  const isCopying = ref(false)
  const lastCopiedText = ref('')
  const lastCopyTime = ref(null)
  
  // Check clipboard API support
  const checkSupport = () => {
    isSupported.value = !!(
      navigator.clipboard && 
      navigator.clipboard.writeText && 
      window.isSecureContext
    )
    return isSupported.value
  }
  
  // Initialize support check
  checkSupport()
  
  // Computed properties
  const canCopy = computed(() => isSupported.value && !isCopying.value)
  const recentlyCopied = computed(() => {
    if (!lastCopyTime.value) return false
    return Date.now() - lastCopyTime.value < 3000 // 3 seconds
  })
  
  /**
   * Copy text to clipboard using modern Clipboard API
   * 
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  const copyWithClipboardAPI = createSafeAsyncWrapper(async (text) => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error('Clipboard API not supported')
    }
    
    await navigator.clipboard.writeText(text)
    return true
  }, 'clipboard-api', onError)
  
  /**
   * Copy text to clipboard using legacy execCommand method
   * 
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  const copyWithExecCommand = createSafeAsyncWrapper(async (text) => {
    // Create temporary textarea element
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    textarea.setAttribute('readonly', '')
    textarea.setAttribute('aria-hidden', 'true')
    
    try {
      // Add to DOM and select
      document.body.appendChild(textarea)
      textarea.select()
      textarea.setSelectionRange(0, text.length)
      
      // Execute copy command
      const success = document.execCommand('copy')
      
      if (!success) {
        throw new Error('execCommand copy failed')
      }
      
      return true
    } finally {
      // Clean up
      document.body.removeChild(textarea)
    }
  }, 'exec-command', onError)
  
  /**
   * Copy text using the best available method
   * 
   * @param {string} text - Text to copy
   * @param {Object} options - Copy options
   * @returns {Promise<boolean>} Success status
   */
  const copyText = async (text, copyOptions = {}) => {
    if (!text || typeof text !== 'string') {
      handleError(new Error('Text to copy must be a non-empty string'), 'clipboard-copy', onError)
      return false
    }
    
    if (isCopying.value) {
      return false // Prevent concurrent copy operations
    }
    
    isCopying.value = true
    
    try {
      let success = false
      
      // Try modern Clipboard API first
      if (isSupported.value) {
        success = await copyWithClipboardAPI(text)
      }
      
      // Fallback to execCommand if Clipboard API failed or not supported
      if (!success && document.execCommand) {
        success = await copyWithExecCommand(text)
      }
      
      if (success) {
        lastCopiedText.value = text
        lastCopyTime.value = Date.now()
        
        if (onSuccess) {
          onSuccess(text, {
            method: isSupported.value ? 'clipboard-api' : 'exec-command',
            timestamp: lastCopyTime.value
          })
        }
        
        return true
      } else {
        throw new Error('All copy methods failed')
      }
    } catch (error) {
      handleError(error, 'clipboard-copy', onError)
      return false
    } finally {
      isCopying.value = false
    }
  }
  
  /**
   * Copy formatted JSON text
   * 
   * @param {string} jsonText - JSON text to copy
   * @param {Object} options - Copy options
   * @returns {Promise<boolean>} Success status
   */
  const copyJson = async (jsonText, options = {}) => {
    const { 
      addMetadata = false, 
      includeTimestamp = false,
      format = 'formatted' // 'formatted' | 'minified'
    } = options
    
    let textToCopy = jsonText
    
    // Add metadata if requested
    if (addMetadata) {
      const metadata = {
        source: 'JSON Formatter',
        format,
        ...(includeTimestamp && { timestamp: new Date().toISOString() })
      }
      
      textToCopy = `${jsonText}\n\n/* ${JSON.stringify(metadata)} */`
    }
    
    return await copyText(textToCopy)
  }
  
  /**
   * Read text from clipboard (if supported)
   * 
   * @returns {Promise<string|null>} Clipboard text or null
   */
  const readText = createSafeAsyncWrapper(async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      throw new Error('Clipboard read not supported')
    }
    
    const text = await navigator.clipboard.readText()
    return text
  }, 'clipboard-read', onError)
  
  /**
   * Check if clipboard contains JSON data
   * 
   * @returns {Promise<boolean>} Whether clipboard contains valid JSON
   */
  const hasJsonContent = async () => {
    try {
      const text = await readText()
      if (!text) return false
      
      JSON.parse(text.trim())
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Get clipboard permissions status
   * 
   * @returns {Promise<string>} Permission status
   */
  const getPermissionStatus = async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'unknown'
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-write' })
      return permission.state // 'granted', 'denied', or 'prompt'
    } catch {
      return 'unknown'
    }
  }
  
  /**
   * Request clipboard permissions
   * 
   * @returns {Promise<boolean>} Whether permission was granted
   */
  const requestPermission = async () => {
    try {
      const status = await getPermissionStatus()
      
      if (status === 'granted') {
        return true
      }
      
      if (status === 'prompt') {
        // Try to trigger permission prompt by attempting a copy
        await copyText(' ')
        return true
      }
      
      return false
    } catch {
      return false
    }
  }
  
  /**
   * Get fallback instructions for manual copying
   * 
   * @returns {Object} Instructions for manual copying
   */
  const getFallbackInstructions = () => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const shortcut = isMac ? 'Cmd+C' : 'Ctrl+C'
    
    return {
      shortcut,
      instructions: [
        'Select all the text you want to copy',
        `Press ${shortcut} to copy`,
        'The text will be copied to your clipboard'
      ],
      alternativeMethod: 'Right-click and select "Copy" from the context menu'
    }
  }
  
  /**
   * Clear clipboard state
   */
  const clearState = () => {
    lastCopiedText.value = ''
    lastCopyTime.value = null
  }
  
  /**
   * Get clipboard statistics
   * 
   * @returns {Object} Clipboard usage statistics
   */
  const getStats = () => {
    return {
      isSupported: isSupported.value,
      lastCopiedLength: lastCopiedText.value.length,
      lastCopyTime: lastCopyTime.value,
      recentlyCopied: recentlyCopied.value,
      canCopy: canCopy.value
    }
  }
  
  return {
    // State
    isSupported,
    isCopying,
    lastCopiedText,
    lastCopyTime,
    
    // Computed
    canCopy,
    recentlyCopied,
    
    // Methods
    copyText,
    copyJson,
    readText,
    hasJsonContent,
    getPermissionStatus,
    requestPermission,
    getFallbackInstructions,
    clearState,
    getStats,
    
    // Utilities
    checkSupport
  }
}
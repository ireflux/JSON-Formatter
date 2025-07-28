/**
 * Error handling utilities
 * Centralized error handling and user-friendly message generation
 */

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  MONACO_INIT: 'monaco_init',
  JSON_PARSE: 'json_parse',
  CLIPBOARD: 'clipboard',
  NETWORK: 'network',
  UNKNOWN: 'unknown'
}

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

/**
 * Determines the error type based on the error object and context
 * 
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @returns {string} The error type
 */
export function getErrorType(error, context) {
  if (context.includes('monaco') || context.includes('editor')) {
    return ERROR_TYPES.MONACO_INIT
  }
  
  if (error.name === 'SyntaxError' || context.includes('json')) {
    return ERROR_TYPES.JSON_PARSE
  }
  
  if (context.includes('clipboard') || error.name === 'NotAllowedError') {
    return ERROR_TYPES.CLIPBOARD
  }
  
  if (error.name === 'NetworkError' || error.name === 'TypeError') {
    return ERROR_TYPES.NETWORK
  }
  
  return ERROR_TYPES.UNKNOWN
}

/**
 * Generates user-friendly error messages based on error type and context
 * 
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error, context) {
  const errorType = getErrorType(error, context)
  
  switch (errorType) {
    case ERROR_TYPES.MONACO_INIT:
      return 'Failed to initialize the editor. Please refresh the page and try again.'
    
    case ERROR_TYPES.JSON_PARSE:
      return getJsonParseErrorMessage(error)
    
    case ERROR_TYPES.CLIPBOARD:
      return 'Unable to access clipboard. Please copy the content manually or check your browser permissions.'
    
    case ERROR_TYPES.NETWORK:
      return 'Network error occurred. Please check your internet connection and try again.'
    
    default:
      return 'An unexpected error occurred. Please try again or refresh the page.'
  }
}

/**
 * Generates specific error messages for JSON parsing errors
 * 
 * @param {Error} error - The JSON parsing error
 * @returns {string} Detailed JSON error message
 */
function getJsonParseErrorMessage(error) {
  const message = error.message.toLowerCase()
  
  if (message.includes('unexpected token')) {
    const match = error.message.match(/unexpected token (.+?) in json at position (\d+)/i)
    if (match) {
      const [, token, position] = match
      return `Invalid JSON: Unexpected character "${token}" at position ${position}. Please check your JSON syntax.`
    }
    return 'Invalid JSON: Unexpected character found. Please check your JSON syntax.'
  }
  
  if (message.includes('unexpected end')) {
    return 'Invalid JSON: Unexpected end of input. Your JSON might be incomplete.'
  }
  
  if (message.includes('expected')) {
    return 'Invalid JSON: Missing required characters. Please check brackets, quotes, and commas.'
  }
  
  return `Invalid JSON: ${error.message}`
}

/**
 * Determines error severity based on error type and context
 * 
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @returns {string} Error severity level
 */
export function getErrorSeverity(error, context) {
  const errorType = getErrorType(error, context)
  
  switch (errorType) {
    case ERROR_TYPES.MONACO_INIT:
      return ERROR_SEVERITY.CRITICAL
    
    case ERROR_TYPES.JSON_PARSE:
      return ERROR_SEVERITY.LOW
    
    case ERROR_TYPES.CLIPBOARD:
      return ERROR_SEVERITY.MEDIUM
    
    case ERROR_TYPES.NETWORK:
      return ERROR_SEVERITY.HIGH
    
    default:
      return ERROR_SEVERITY.MEDIUM
  }
}

/**
 * Centralized error handler
 * 
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @param {Function} onError - Callback function to handle the error
 */
export function handleError(error, context, onError) {
  // Log error for debugging
  console.error(`Error in ${context}:`, error)
  
  const userMessage = getUserFriendlyMessage(error, context)
  const severity = getErrorSeverity(error, context)
  
  // Call error handler with processed error information
  if (typeof onError === 'function') {
    onError({
      originalError: error,
      context,
      message: userMessage,
      severity,
      type: getErrorType(error, context)
    })
  }
  
  // In production, you might want to send errors to a tracking service
  if (import.meta.env.PROD && severity === ERROR_SEVERITY.CRITICAL) {
    // trackError(error, context)
  }
}

/**
 * Creates a safe async wrapper that handles errors gracefully
 * 
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} context - The context for error handling
 * @param {Function} onError - Error handler callback
 * @returns {Function} Wrapped async function
 */
export function createSafeAsyncWrapper(asyncFn, context, onError) {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      handleError(error, context, onError)
      return null
    }
  }
}
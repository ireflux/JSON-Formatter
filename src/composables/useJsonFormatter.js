/**
 * JSON Formatter composable
 * Handles JSON parsing, formatting, validation, and related operations
 */

import { ref, computed } from 'vue'
import { debounce } from '../utils/debounce.js'
import { handleError, createSafeAsyncWrapper } from '../utils/errorHandling.js'
import { JSON_FORMAT_CONFIG } from '../constants/editorConfig.js'

/**
 * JSON Formatter composable
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onError - Error handler callback
 * @param {Function} options.onFormatComplete - Format completion callback
 * @returns {Object} JSON formatting functions and state
 */
export function useJsonFormatter(options = {}) {
  const { onError, onFormatComplete } = options
  
  // Reactive state
  const isFormatting = ref(false)
  const isValid = ref(true)
  const validationError = ref(null)
  const lastFormattedContent = ref('')
  const formatStats = ref({
    originalSize: 0,
    formattedSize: 0,
    compressionRatio: 0,
    processingTime: 0
  })
  
  // Computed properties
  const hasValidationError = computed(() => !isValid.value && validationError.value)
  const canFormat = computed(() => !isFormatting.value && isValid.value)
  
  /**
   * Validate JSON string
   * 
   * @param {string} jsonString - JSON string to validate
   * @returns {Object} Validation result with isValid flag and parsed data
   */
  const validateJson = (jsonString) => {
    if (!jsonString || typeof jsonString !== 'string') {
      return {
        isValid: false,
        error: new Error('Input must be a non-empty string'),
        data: null
      }
    }
    
    // Check file size limit
    if (jsonString.length > JSON_FORMAT_CONFIG.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: new Error(`File size exceeds limit of ${JSON_FORMAT_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`),
        data: null
      }
    }
    
    try {
      const trimmed = jsonString.trim()
      if (!trimmed) {
        return {
          isValid: false,
          error: new Error('JSON content cannot be empty'),
          data: null
        }
      }
      
      const parsed = JSON.parse(trimmed)
      return {
        isValid: true,
        error: null,
        data: parsed
      }
    } catch (error) {
      return {
        isValid: false,
        error,
        data: null
      }
    }
  }
  
  /**
   * Format JSON string with specified indentation
   * 
   * @param {string} jsonString - JSON string to format
   * @param {number} indentSize - Number of spaces for indentation
   * @param {boolean} sortKeys - Whether to sort object keys
   * @returns {string} Formatted JSON string
   */
  const formatJson = createSafeAsyncWrapper(async (jsonString, indentSize = JSON_FORMAT_CONFIG.INDENT_SIZE, sortKeys = false) => {
    const startTime = performance.now()
    isFormatting.value = true
    
    try {
      const validation = validateJson(jsonString)
      
      if (!validation.isValid) {
        isValid.value = false
        validationError.value = validation.error
        throw validation.error
      }
      
      // Clear previous validation errors
      isValid.value = true
      validationError.value = null
      
      // Format the JSON
      let formatted
      if (sortKeys) {
        formatted = JSON.stringify(validation.data, sortObjectKeys, indentSize)
      } else {
        formatted = JSON.stringify(validation.data, null, indentSize)
      }
      
      // Update stats
      const endTime = performance.now()
      formatStats.value = {
        originalSize: jsonString.length,
        formattedSize: formatted.length,
        compressionRatio: ((jsonString.length - formatted.length) / jsonString.length * 100).toFixed(2),
        processingTime: (endTime - startTime).toFixed(2)
      }
      
      lastFormattedContent.value = formatted
      
      // Notify completion
      if (onFormatComplete) {
        onFormatComplete(formatted, formatStats.value)
      }
      
      return formatted
    } finally {
      isFormatting.value = false
    }
  }, 'json-formatting', onError)
  
  /**
   * Minify JSON string (remove all unnecessary whitespace)
   * 
   * @param {string} jsonString - JSON string to minify
   * @returns {string} Minified JSON string
   */
  const minifyJson = createSafeAsyncWrapper(async (jsonString) => {
    const startTime = performance.now()
    isFormatting.value = true
    
    try {
      const validation = validateJson(jsonString)
      
      if (!validation.isValid) {
        isValid.value = false
        validationError.value = validation.error
        throw validation.error
      }
      
      // Clear previous validation errors
      isValid.value = true
      validationError.value = null
      
      // Minify the JSON
      const minified = JSON.stringify(validation.data)
      
      // Update stats
      const endTime = performance.now()
      formatStats.value = {
        originalSize: jsonString.length,
        formattedSize: minified.length,
        compressionRatio: ((jsonString.length - minified.length) / jsonString.length * 100).toFixed(2),
        processingTime: (endTime - startTime).toFixed(2)
      }
      
      return minified
    } finally {
      isFormatting.value = false
    }
  }, 'json-minification', onError)
  
  /**
   * Pretty print JSON with custom formatting options
   * 
   * @param {string} jsonString - JSON string to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted JSON string
   */
  const prettyPrintJson = createSafeAsyncWrapper(async (jsonString, options = {}) => {
    const {
      indent = JSON_FORMAT_CONFIG.INDENT_SIZE,
      sortKeys = false,
      maxLineLength = 120,
      insertFinalNewline = true
    } = options
    
    let formatted = await formatJson(jsonString, indent, sortKeys)
    
    if (!formatted) return null
    
    // Add final newline if requested
    if (insertFinalNewline && !formatted.endsWith('\n')) {
      formatted += '\n'
    }
    
    return formatted
  }, 'json-pretty-print', onError)
  
  /**
   * Compare two JSON objects and return differences
   * 
   * @param {string} json1 - First JSON string
   * @param {string} json2 - Second JSON string
   * @returns {Object} Comparison result
   */
  const compareJson = createSafeAsyncWrapper(async (json1, json2) => {
    const validation1 = validateJson(json1)
    const validation2 = validateJson(json2)
    
    if (!validation1.isValid) {
      throw new Error(`First JSON is invalid: ${validation1.error.message}`)
    }
    
    if (!validation2.isValid) {
      throw new Error(`Second JSON is invalid: ${validation2.error.message}`)
    }
    
    const differences = findJsonDifferences(validation1.data, validation2.data)
    
    return {
      areEqual: differences.length === 0,
      differences,
      summary: {
        totalDifferences: differences.length,
        addedKeys: differences.filter(d => d.type === 'added').length,
        removedKeys: differences.filter(d => d.type === 'removed').length,
        modifiedKeys: differences.filter(d => d.type === 'modified').length
      }
    }
  }, 'json-comparison', onError)
  
  /**
   * Extract JSON schema from a JSON object
   * 
   * @param {string} jsonString - JSON string to analyze
   * @returns {Object} JSON schema
   */
  const extractSchema = createSafeAsyncWrapper(async (jsonString) => {
    const validation = validateJson(jsonString)
    
    if (!validation.isValid) {
      throw validation.error
    }
    
    return generateJsonSchema(validation.data)
  }, 'schema-extraction', onError)
  
  /**
   * Create debounced version of formatJson for real-time formatting
   */
  const debouncedFormat = debounce(
    (jsonString, callback) => {
      formatJson(jsonString).then(callback)
    },
    JSON_FORMAT_CONFIG.DEBOUNCE_DELAY
  )
  
  /**
   * Validate JSON in real-time (debounced)
   */
  const debouncedValidate = debounce((jsonString) => {
    const validation = validateJson(jsonString)
    isValid.value = validation.isValid
    validationError.value = validation.error
  }, 150) // Shorter delay for validation
  
  /**
   * Clear validation state
   */
  const clearValidation = () => {
    isValid.value = true
    validationError.value = null
  }
  
  /**
   * Reset all state
   */
  const reset = () => {
    isFormatting.value = false
    isValid.value = true
    validationError.value = null
    lastFormattedContent.value = ''
    formatStats.value = {
      originalSize: 0,
      formattedSize: 0,
      compressionRatio: 0,
      processingTime: 0
    }
  }
  
  return {
    // State
    isFormatting,
    isValid,
    validationError,
    lastFormattedContent,
    formatStats,
    
    // Computed
    hasValidationError,
    canFormat,
    
    // Methods
    validateJson,
    formatJson,
    minifyJson,
    prettyPrintJson,
    compareJson,
    extractSchema,
    debouncedFormat,
    debouncedValidate,
    clearValidation,
    reset
  }
}

/**
 * Helper function to sort object keys recursively
 * 
 * @param {string} key - Object key
 * @param {*} value - Object value
 * @returns {*} Processed value
 */
function sortObjectKeys(key, value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sortedObj = {}
    Object.keys(value).sort().forEach(k => {
      sortedObj[k] = value[k]
    })
    return sortedObj
  }
  return value
}

/**
 * Find differences between two JSON objects
 * 
 * @param {*} obj1 - First object
 * @param {*} obj2 - Second object
 * @param {string} path - Current path in the object
 * @returns {Array} Array of differences
 */
function findJsonDifferences(obj1, obj2, path = '') {
  const differences = []
  
  // Handle primitive values
  if (obj1 !== obj2 && (typeof obj1 !== 'object' || typeof obj2 !== 'object')) {
    differences.push({
      path,
      type: 'modified',
      oldValue: obj1,
      newValue: obj2
    })
    return differences
  }
  
  // Handle null values
  if (obj1 === null || obj2 === null) {
    if (obj1 !== obj2) {
      differences.push({
        path,
        type: 'modified',
        oldValue: obj1,
        newValue: obj2
      })
    }
    return differences
  }
  
  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLength = Math.max(obj1.length, obj2.length)
    for (let i = 0; i < maxLength; i++) {
      const currentPath = `${path}[${i}]`
      if (i >= obj1.length) {
        differences.push({
          path: currentPath,
          type: 'added',
          newValue: obj2[i]
        })
      } else if (i >= obj2.length) {
        differences.push({
          path: currentPath,
          type: 'removed',
          oldValue: obj1[i]
        })
      } else {
        differences.push(...findJsonDifferences(obj1[i], obj2[i], currentPath))
      }
    }
    return differences
  }
  
  // Handle objects
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key
      
      if (!(key in obj1)) {
        differences.push({
          path: currentPath,
          type: 'added',
          newValue: obj2[key]
        })
      } else if (!(key in obj2)) {
        differences.push({
          path: currentPath,
          type: 'removed',
          oldValue: obj1[key]
        })
      } else {
        differences.push(...findJsonDifferences(obj1[key], obj2[key], currentPath))
      }
    }
  }
  
  return differences
}

/**
 * Generate JSON schema from a JSON object
 * 
 * @param {*} obj - Object to analyze
 * @returns {Object} JSON schema
 */
function generateJsonSchema(obj) {
  if (obj === null) {
    return { type: 'null' }
  }
  
  if (Array.isArray(obj)) {
    const itemSchemas = obj.map(generateJsonSchema)
    const uniqueSchemas = itemSchemas.filter((schema, index, arr) => 
      arr.findIndex(s => JSON.stringify(s) === JSON.stringify(schema)) === index
    )
    
    return {
      type: 'array',
      items: uniqueSchemas.length === 1 ? uniqueSchemas[0] : { oneOf: uniqueSchemas }
    }
  }
  
  if (typeof obj === 'object') {
    const properties = {}
    const required = []
    
    for (const [key, value] of Object.entries(obj)) {
      properties[key] = generateJsonSchema(value)
      required.push(key)
    }
    
    return {
      type: 'object',
      properties,
      required
    }
  }
  
  return { type: typeof obj }
}
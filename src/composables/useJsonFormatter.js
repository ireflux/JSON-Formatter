import { JSON_FORMAT_CONFIG } from '../constants/editorConfig.js'
import { createSafeAsyncWrapper } from '../utils/errorHandling.js'

export function useJsonFormatter(options = {}) {
  const { onError } = options

  const validateJson = (jsonString) => {
    if (!jsonString || typeof jsonString !== 'string') {
      return {
        isValid: false,
        error: new Error('Input must be a non-empty string'),
        data: null
      }
    }

    if (jsonString.length > JSON_FORMAT_CONFIG.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: new Error(`File size exceeds limit of ${JSON_FORMAT_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`),
        data: null
      }
    }

    try {
      const parsed = JSON.parse(jsonString.trim())
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

  const minifyJson = createSafeAsyncWrapper(async (jsonString) => {
    const validation = validateJson(jsonString)
    if (!validation.isValid) {
      throw validation.error
    }

    return JSON.stringify(validation.data)
  }, 'json-minification', onError)

  return {
    validateJson,
    minifyJson
  }
}

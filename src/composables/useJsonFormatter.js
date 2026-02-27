import { JSON_FORMAT_CONFIG } from '../constants/editorConfig.js'
import { createSafeAsyncWrapper } from '../utils/errorHandling.js'
import { parseJsonString, minifyJsonData } from '../utils/jsonProcessing.js'

export function useJsonFormatter(options = {}) {
  const { onError } = options

  const validateJson = (jsonString) => {
    try {
      const parsed = parseJsonString(jsonString, {
        maxFileSize: JSON_FORMAT_CONFIG.MAX_FILE_SIZE,
        requireNonEmpty: true
      })
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

    return minifyJsonData(validation.data)
  }, 'json-minification', onError)

  return {
    validateJson,
    minifyJson
  }
}

import { JSON_FORMAT_CONFIG } from '../constants/editorConfig.js'

export function parseJsonString(jsonString, options = {}) {
  const {
    maxFileSize = JSON_FORMAT_CONFIG.MAX_FILE_SIZE,
    requireNonEmpty = true
  } = options

  if (typeof jsonString !== 'string') {
    throw new Error('Input must be a string')
  }

  const trimmed = jsonString.trim()
  if (requireNonEmpty && trimmed.length === 0) {
    throw new Error('Input must be a non-empty string')
  }

  if (jsonString.length > maxFileSize) {
    throw new Error(`File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB`)
  }

  return JSON.parse(trimmed)
}

export function formatJsonData(jsonData, indentSize = JSON_FORMAT_CONFIG.INDENT_SIZE) {
  return JSON.stringify(jsonData, null, indentSize)
}

export function minifyJsonData(jsonData) {
  return JSON.stringify(jsonData)
}

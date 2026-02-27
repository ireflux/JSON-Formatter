import { handleError } from '../utils/errorHandling.js'

export function useClipboard(options = {}) {
  const { onError } = options

  const copyText = async (text) => {
    if (!text || typeof text !== 'string') {
      handleError(new Error('Text to copy must be a non-empty string'), 'clipboard-copy', onError)
      return false
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      }

      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      textarea.setAttribute('readonly', '')

      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      return copied
    } catch (error) {
      handleError(error, 'clipboard-copy', onError)
      return false
    }
  }

  return {
    copyText
  }
}

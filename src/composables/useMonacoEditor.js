/**
 * Monaco Editor composable
 * Manages editor lifecycle, lazy diff initialization, and cleanup.
 */

import { ref, onBeforeUnmount } from 'vue'
import { loadMonaco } from '../utils/monacoLoader.js'
import {
  BASE_EDITOR_CONFIG,
  DIFF_EDITOR_CONFIG,
  DEFAULT_JSON_CONTENT,
  JSON_FORMAT_CONFIG
} from '../constants/editorConfig.js'
import { handleError } from '../utils/errorHandling.js'

export function useMonacoEditor(options = {}) {
  const { onError } = options

  const isLoading = ref(false)
  const isInitialized = ref(false)
  const isDiffMode = ref(false)

  let monaco = null
  let normalEditor = null
  let diffEditor = null
  let normalContainer = null
  let diffContainer = null
  let normalAutoFormatCleanup = null
  let diffOriginalAutoFormatCleanup = null
  let diffModifiedAutoFormatCleanup = null

  const models = {
    normal: null,
    diffOriginal: null,
    diffModified: null
  }

  const initMonaco = async () => {
    if (monaco) return monaco

    monaco = await loadMonaco()
    return monaco
  }

  const runBuiltInFormatDocument = async (editor) => {
    const action = editor?.getAction?.('editor.action.formatDocument')
    if (!action) return false

    await action.run()
    return true
  }

  const shouldAutoFormat = (editor) => {
    if (!editor?.hasTextFocus?.()) return false

    const selections = editor.getSelections?.() ?? []
    if (selections.length > 1) return false

    const selection = editor.getSelection?.()
    return !selection || selection.isEmpty()
  }

  const bindIdleAutoFormat = (editor) => {
    if (!editor?.onDidChangeModelContent) return null

    let timerId = null
    let isAutoFormatting = false

    const disposable = editor.onDidChangeModelContent((event) => {
      if (isAutoFormatting || event.isFlush) return
      if (!event.changes || event.changes.length === 0) return

      if (timerId) {
        clearTimeout(timerId)
      }

      timerId = setTimeout(async () => {
        timerId = null
        if (!shouldAutoFormat(editor)) return

        isAutoFormatting = true
        try {
          await runBuiltInFormatDocument(editor)
        } catch {
          // Ignore formatting failure while typing to keep editing uninterrupted.
        } finally {
          isAutoFormatting = false
        }
      }, JSON_FORMAT_CONFIG.AUTO_FORMAT_DEBOUNCE_MS)
    })

    return {
      dispose() {
        if (timerId) {
          clearTimeout(timerId)
          timerId = null
        }
        disposable.dispose()
      }
    }
  }

  const createNormalEditor = (initialValue) => {
    if (!normalContainer || !monaco) return

    disposeNormalEditor()

    normalEditor = monaco.editor.create(normalContainer, {
      ...BASE_EDITOR_CONFIG,
      value: initialValue
    })
    models.normal = normalEditor.getModel()
    normalAutoFormatCleanup = bindIdleAutoFormat(normalEditor)
  }

  const ensureDiffEditor = (content) => {
    if (!diffContainer || !monaco) return

    if (!diffEditor) {
      diffEditor = monaco.editor.createDiffEditor(diffContainer, DIFF_EDITOR_CONFIG)
      models.diffOriginal = monaco.editor.createModel(content, 'json')
      models.diffModified = monaco.editor.createModel(content, 'json')
      diffEditor.setModel({
        original: models.diffOriginal,
        modified: models.diffModified
      })
      diffOriginalAutoFormatCleanup = bindIdleAutoFormat(diffEditor.getOriginalEditor())
      diffModifiedAutoFormatCleanup = bindIdleAutoFormat(diffEditor.getModifiedEditor())
      return
    }

    models.diffOriginal?.setValue(content)
    models.diffModified?.setValue(content)
  }

  const initialize = async ({
    normalEditorContainer,
    diffEditorContainer,
    initialValue = DEFAULT_JSON_CONTENT
  }) => {
    if (!normalEditorContainer || !diffEditorContainer) {
      handleError(new Error('Editor containers are required'), 'editor-initialization', onError)
      return
    }

    isLoading.value = true
    try {
      normalContainer = normalEditorContainer
      diffContainer = diffEditorContainer

      await initMonaco()
      createNormalEditor(initialValue)
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'editor-initialization', onError)
    } finally {
      isLoading.value = false
    }
  }

  const getCurrentContent = () => {
    if (isDiffMode.value && diffEditor) {
      return diffEditor.getModifiedEditor().getValue()
    }

    return normalEditor?.getValue() ?? ''
  }

  const toggleDiffMode = async () => {
    if (isLoading.value || !isInitialized.value) return

    isLoading.value = true
    try {
      if (isDiffMode.value) {
        const content = diffEditor?.getModifiedEditor().getValue() ?? ''
        normalEditor?.setValue(content)
        isDiffMode.value = false
        normalEditor?.layout()
        return
      }

      const currentValue = normalEditor?.getValue() ?? DEFAULT_JSON_CONTENT
      ensureDiffEditor(currentValue)
      isDiffMode.value = true
      diffEditor?.layout()
    } catch (error) {
      handleError(error, 'diff-mode-toggle', onError)
    } finally {
      isLoading.value = false
    }
  }

  const formatContent = async () => {
    try {
      if (isDiffMode.value && diffEditor) {
        await runBuiltInFormatDocument(diffEditor.getOriginalEditor())
        await runBuiltInFormatDocument(diffEditor.getModifiedEditor())
        return diffEditor.getModifiedEditor().getValue()
      }

      if (!normalEditor) return ''

      await runBuiltInFormatDocument(normalEditor)
      return normalEditor.getValue()
    } catch (error) {
      handleError(error, 'json-formatting', onError)
      return null
    }
  }

  const resize = () => {
    normalEditor?.layout()
    diffEditor?.layout()
  }

  const disposeNormalEditor = () => {
    normalAutoFormatCleanup?.dispose()
    normalAutoFormatCleanup = null

    models.normal?.dispose()
    models.normal = null
    normalEditor?.dispose()
    normalEditor = null
  }

  const disposeDiffEditor = () => {
    diffOriginalAutoFormatCleanup?.dispose()
    diffModifiedAutoFormatCleanup?.dispose()
    diffOriginalAutoFormatCleanup = null
    diffModifiedAutoFormatCleanup = null

    diffEditor?.setModel(null)

    models.diffOriginal?.dispose()
    models.diffModified?.dispose()
    models.diffOriginal = null
    models.diffModified = null

    diffEditor?.dispose()
    diffEditor = null
  }

  const cleanup = () => {
    disposeDiffEditor()
    disposeNormalEditor()
    monaco = null
    isInitialized.value = false
    isDiffMode.value = false
  }

  onBeforeUnmount(cleanup)

  return {
    isLoading,
    isInitialized,
    isDiffMode,
    initialize,
    toggleDiffMode,
    getCurrentContent,
    formatContent,
    resize,
    cleanup
  }
}

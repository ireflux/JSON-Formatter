/**
 * Monaco Editor composable
 * Manages editor lifecycle, lazy diff initialization, custom context menu, and cleanup.
 */

import { ref, onBeforeUnmount } from 'vue'
import { configureMonacoLoader } from '../utils/monacoLoader.js'
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
  const contextMenuState = ref({
    visible: false,
    x: 0,
    y: 0
  })

  const contextMenuItems = [
    { id: 'formatDocument', label: 'Format Document' },
    { id: 'formatSelection', label: 'Format Selection' },
    { id: 'copy', label: 'Copy' },
    { id: 'cut', label: 'Cut' },
    { id: 'paste', label: 'Paste' },
    { id: 'rename', label: 'Rename Symbol' },
    { id: 'goToBracket', label: 'Go to Bracket' },
    { id: 'fold', label: 'Fold' },
    { id: 'unfold', label: 'Unfold' },
    { id: 'commandPalette', label: 'Command Palette' },
    { id: 'copyAsJsonString', label: 'Copy as JSON String' }
  ]

  let monaco = null
  let normalEditor = null
  let diffEditor = null
  let normalContainer = null
  let diffContainer = null
  let activeContextEditor = null
  let normalContextMenuCleanup = null
  let diffOriginalContextMenuCleanup = null
  let diffModifiedContextMenuCleanup = null
  let windowListenersBound = false

  const models = {
    normal: null,
    diffOriginal: null,
    diffModified: null
  }

  const hideContextMenu = () => {
    contextMenuState.value.visible = false
  }

  const bindWindowListeners = () => {
    if (windowListenersBound) return
    windowListenersBound = true

    window.addEventListener('click', hideContextMenu)
    window.addEventListener('scroll', hideContextMenu, true)
    window.addEventListener('resize', hideContextMenu)
    window.addEventListener('keydown', handleWindowKeydown)
  }

  const unbindWindowListeners = () => {
    if (!windowListenersBound) return
    windowListenersBound = false

    window.removeEventListener('click', hideContextMenu)
    window.removeEventListener('scroll', hideContextMenu, true)
    window.removeEventListener('resize', hideContextMenu)
    window.removeEventListener('keydown', handleWindowKeydown)
  }

  const handleWindowKeydown = (event) => {
    if (event.key === 'Escape') {
      hideContextMenu()
    }
  }

  const attachContextMenu = (editor) => {
    if (!editor || !editor.getDomNode) return null

    const domNode = editor.getDomNode()
    if (!domNode) return null

    const handler = (event) => {
      event.preventDefault()
      event.stopPropagation()

      activeContextEditor = editor
      contextMenuState.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY
      }
    }

    domNode.addEventListener('contextmenu', handler)
    return () => domNode.removeEventListener('contextmenu', handler)
  }

  const initMonaco = async () => {
    if (monaco) return monaco

    const { default: loader } = await import('@monaco-editor/loader')
    await configureMonacoLoader(loader)
    monaco = await loader.init()
    return monaco
  }

  const createNormalEditor = (initialValue) => {
    if (!normalContainer || !monaco) return

    disposeNormalEditor()

    normalEditor = monaco.editor.create(normalContainer, {
      ...BASE_EDITOR_CONFIG,
      value: initialValue
    })
    models.normal = normalEditor.getModel()
    normalContextMenuCleanup = attachContextMenu(normalEditor)
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

      diffOriginalContextMenuCleanup = attachContextMenu(diffEditor.getOriginalEditor())
      diffModifiedContextMenuCleanup = attachContextMenu(diffEditor.getModifiedEditor())
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
      bindWindowListeners()
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
        const originalValue = diffEditor.getOriginalEditor().getValue()
        const modifiedValue = diffEditor.getModifiedEditor().getValue()

        const formattedOriginal = JSON.stringify(JSON.parse(originalValue), null, JSON_FORMAT_CONFIG.INDENT_SIZE)
        const formattedModified = JSON.stringify(JSON.parse(modifiedValue), null, JSON_FORMAT_CONFIG.INDENT_SIZE)

        diffEditor.getOriginalEditor().executeEdits('format', [{
          range: diffEditor.getOriginalEditor().getModel().getFullModelRange(),
          text: formattedOriginal,
          forceMoveMarkers: true
        }])

        diffEditor.getModifiedEditor().executeEdits('format', [{
          range: diffEditor.getModifiedEditor().getModel().getFullModelRange(),
          text: formattedModified,
          forceMoveMarkers: true
        }])

        return formattedModified
      }

      if (!normalEditor) return ''

      const currentValue = normalEditor.getValue()
      const formatted = JSON.stringify(JSON.parse(currentValue), null, JSON_FORMAT_CONFIG.INDENT_SIZE)

      if (formatted !== currentValue) {
        normalEditor.executeEdits('format', [{
          range: normalEditor.getModel().getFullModelRange(),
          text: formatted,
          forceMoveMarkers: true
        }])
      }

      return formatted
    } catch (error) {
      handleError(error, 'json-formatting', onError)
      return null
    }
  }

  const resize = () => {
    normalEditor?.layout()
    diffEditor?.layout()
  }

  const runActiveEditorAction = async (actionId) => {
    if (!activeContextEditor) return
    const action = activeContextEditor.getAction?.(actionId)
    if (action) {
      await action.run()
    }
  }

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.setAttribute('readonly', '')
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  const copyAsJsonString = async () => {
    if (!activeContextEditor) return

    const model = activeContextEditor.getModel?.()
    if (!model) return

    const selection = activeContextEditor.getSelection?.()
    const selectedText = selection && !selection.isEmpty()
      ? model.getValueInRange(selection)
      : model.getValue()

    const escaped = JSON.stringify(selectedText)
    if (!escaped) return

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(escaped)
      } else {
        fallbackCopy(escaped)
      }
    } catch (error) {
      handleError(error, 'context-menu-copy-json-string', onError)
    }
  }

  const executeContextMenuAction = async (actionId) => {
    try {
      switch (actionId) {
        case 'formatDocument':
          await runActiveEditorAction('editor.action.formatDocument')
          break
        case 'formatSelection':
          await runActiveEditorAction('editor.action.formatSelection')
          break
        case 'copy':
          await runActiveEditorAction('editor.action.clipboardCopyAction')
          break
        case 'cut':
          await runActiveEditorAction('editor.action.clipboardCutAction')
          break
        case 'paste':
          await runActiveEditorAction('editor.action.clipboardPasteAction')
          break
        case 'rename':
          await runActiveEditorAction('editor.action.rename')
          break
        case 'goToBracket':
          await runActiveEditorAction('editor.action.jumpToBracket')
          break
        case 'fold':
          await runActiveEditorAction('editor.fold')
          break
        case 'unfold':
          await runActiveEditorAction('editor.unfold')
          break
        case 'commandPalette':
          await runActiveEditorAction('editor.action.quickCommand')
          break
        case 'copyAsJsonString':
          await copyAsJsonString()
          break
        default:
          break
      }
    } finally {
      hideContextMenu()
    }
  }

  const disposeNormalEditor = () => {
    normalContextMenuCleanup?.()
    normalContextMenuCleanup = null

    models.normal?.dispose()
    models.normal = null
    normalEditor?.dispose()
    normalEditor = null
  }

  const disposeDiffEditor = () => {
    diffOriginalContextMenuCleanup?.()
    diffModifiedContextMenuCleanup?.()
    diffOriginalContextMenuCleanup = null
    diffModifiedContextMenuCleanup = null

    diffEditor?.setModel(null)

    models.diffOriginal?.dispose()
    models.diffModified?.dispose()
    models.diffOriginal = null
    models.diffModified = null

    diffEditor?.dispose()
    diffEditor = null
  }

  const cleanup = () => {
    hideContextMenu()
    activeContextEditor = null
    unbindWindowListeners()
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
    contextMenuState,
    contextMenuItems,
    initialize,
    toggleDiffMode,
    hideContextMenu,
    executeContextMenuAction,
    getCurrentContent,
    formatContent,
    resize,
    cleanup
  }
}

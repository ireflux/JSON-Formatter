/**
 * Monaco Editor composable
 * Manages Monaco editor lifecycle, configuration, and operations
 */

import { ref, onBeforeUnmount, nextTick } from 'vue'
import loader from '@monaco-editor/loader'
import { 
  BASE_EDITOR_CONFIG, 
  DIFF_EDITOR_CONFIG, 
  DEFAULT_JSON_CONTENT,
  EDITOR_KEYBINDINGS 
} from '../constants/editorConfig.js'
import { handleError, createSafeAsyncWrapper } from '../utils/errorHandling.js'

/**
 * Monaco Editor composable
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onError - Error handler callback
 * @param {Function} options.onContentChange - Content change callback
 * @returns {Object} Editor management functions and state
 */
export function useMonacoEditor(options = {}) {
  const { onError, onContentChange } = options
  
  // Reactive state
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const currentEditor = ref(null)
  const currentDiffEditor = ref(null)
  const isDiffMode = ref(false)
  const editorContainer = ref(null)
  
  // Monaco instance cache
  let monacoInstance = null
  
  /**
   * Initialize Monaco Editor loader
   */
  const initializeMonaco = createSafeAsyncWrapper(async () => {
    if (monacoInstance) {
      return monacoInstance
    }
    
    isLoading.value = true
    monacoInstance = await loader.init()
    isLoading.value = false
    isInitialized.value = true
    
    return monacoInstance
  }, 'monaco-initialization', onError)
  
  /**
   * Create a standard Monaco editor instance
   * 
   * @param {HTMLElement} container - DOM container element
   * @param {Object} config - Editor configuration
   * @returns {Object} Monaco editor instance
   */
  const createEditor = createSafeAsyncWrapper(async (container, config = {}) => {
    const monaco = await initializeMonaco()
    if (!monaco || !container) return null
    
    const editorConfig = {
      ...BASE_EDITOR_CONFIG,
      ...config,
      value: config.value || DEFAULT_JSON_CONTENT
    }
    
    const editor = monaco.editor.create(container, editorConfig)
    
    // Set up keybindings
    setupKeybindings(monaco, editor)
    
    // Set up event listeners
    setupEditorEventListeners(editor)
    
    return editor
  }, 'editor-creation', onError)
  
  /**
   * Create a diff editor instance
   * 
   * @param {HTMLElement} container - DOM container element
   * @param {Object} config - Editor configuration
   * @returns {Object} Monaco diff editor instance
   */
  const createDiffEditor = createSafeAsyncWrapper(async (container, config = {}) => {
    const monaco = await initializeMonaco()
    if (!monaco || !container) return null
    
    const editorConfig = {
      ...DIFF_EDITOR_CONFIG,
      ...config
    }
    
    const diffEditor = monaco.editor.createDiffEditor(container, editorConfig)
    
    // Set up keybindings for both editors
    setupKeybindings(monaco, diffEditor.getOriginalEditor())
    setupKeybindings(monaco, diffEditor.getModifiedEditor())
    
    // Set up event listeners
    setupDiffEditorEventListeners(diffEditor)
    
    return diffEditor
  }, 'diff-editor-creation', onError)
  
  /**
   * Set up keyboard shortcuts for editor
   * 
   * @param {Object} monaco - Monaco instance
   * @param {Object} editor - Editor instance
   */
  function setupKeybindings(monaco, editor) {
    if (!monaco || !editor) return
    
    EDITOR_KEYBINDINGS.forEach(binding => {
      try {
        // Add keybinding based on the action ID
        const keybinding = getKeybindingForAction(monaco, binding.id)
        if (keybinding) {
          editor.addAction({
            id: binding.id,
            label: binding.label,
            keybindings: [keybinding],
            run: () => {
              editor.trigger('keyboard', binding.id, null)
            }
          })
        }
      } catch (error) {
        console.warn(`Failed to set up keybinding for ${binding.id}:`, error)
      }
    })
  }
  
  /**
   * Get Monaco keybinding for action
   * 
   * @param {Object} monaco - Monaco instance
   * @param {string} actionId - Action identifier
   * @returns {number|null} Keybinding code
   */
  function getKeybindingForAction(monaco, actionId) {
    const KeyMod = monaco.KeyMod
    const KeyCode = monaco.KeyCode
    
    const keybindingMap = {
      'editor.action.selectAll': KeyMod.CtrlCmd | KeyCode.KeyA,
      'undo': KeyMod.CtrlCmd | KeyCode.KeyZ,
      'redo': KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ,
      'editor.action.copyLinesUpAction': KeyMod.Alt | KeyMod.Shift | KeyCode.ArrowUp,
      'editor.action.copyLinesDownAction': KeyMod.Alt | KeyMod.Shift | KeyCode.ArrowDown,
      'editor.action.moveLinesUpAction': KeyMod.Alt | KeyCode.ArrowUp,
      'editor.action.moveLinesDownAction': KeyMod.Alt | KeyCode.ArrowDown,
      'editor.action.deleteLines': KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyK,
      'editor.action.insertCursorAbove': KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.ArrowUp,
      'editor.action.insertCursorBelow': KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.ArrowDown
    }
    
    return keybindingMap[actionId] || null
  }
  
  /**
   * Set up event listeners for standard editor
   * 
   * @param {Object} editor - Editor instance
   */
  function setupEditorEventListeners(editor) {
    if (!editor) return
    
    // Content change listener
    const contentChangeDisposable = editor.onDidChangeModelContent(() => {
      if (onContentChange) {
        onContentChange(editor.getValue())
      }
    })
    
    // Store disposable for cleanup
    if (!editor._customDisposables) {
      editor._customDisposables = []
    }
    editor._customDisposables.push(contentChangeDisposable)
  }
  
  /**
   * Set up event listeners for diff editor
   * 
   * @param {Object} diffEditor - Diff editor instance
   */
  function setupDiffEditorEventListeners(diffEditor) {
    if (!diffEditor) return
    
    const originalEditor = diffEditor.getOriginalEditor()
    const modifiedEditor = diffEditor.getModifiedEditor()
    
    // Content change listeners
    const originalChangeDisposable = originalEditor.onDidChangeModelContent(() => {
      if (onContentChange) {
        onContentChange(originalEditor.getValue(), 'original')
      }
    })
    
    const modifiedChangeDisposable = modifiedEditor.onDidChangeModelContent(() => {
      if (onContentChange) {
        onContentChange(modifiedEditor.getValue(), 'modified')
      }
    })
    
    // Store disposables for cleanup
    if (!diffEditor._customDisposables) {
      diffEditor._customDisposables = []
    }
    diffEditor._customDisposables.push(originalChangeDisposable, modifiedChangeDisposable)
  }
  
  /**
   * Initialize editor in the provided container
   * 
   * @param {HTMLElement} container - DOM container element
   * @param {Object} config - Editor configuration
   */
  const initializeEditor = async (container, config = {}) => {
    if (!container) {
      handleError(new Error('Container element is required'), 'editor-initialization', onError)
      return
    }
    
    editorContainer.value = container
    
    // Clean up existing editor
    await cleanupCurrentEditor()
    
    // Create new editor
    if (isDiffMode.value) {
      currentDiffEditor.value = await createDiffEditor(container, config)
    } else {
      currentEditor.value = await createEditor(container, config)
    }
  }
  
  /**
   * Toggle between normal and diff editor modes
   * 
   * @param {string} currentContent - Current editor content to preserve
   */
  const toggleDiffMode = async (currentContent = DEFAULT_JSON_CONTENT) => {
    if (!editorContainer.value) return
    
    const container = editorContainer.value
    isDiffMode.value = !isDiffMode.value
    
    // Clean up current editor
    await cleanupCurrentEditor()
    
    // Wait for DOM update
    await nextTick()
    
    if (isDiffMode.value) {
      // Switch to diff editor
      currentDiffEditor.value = await createDiffEditor(container)
      
      if (currentDiffEditor.value && monacoInstance) {
        // Set models with current content
        currentDiffEditor.value.setModel({
          original: monacoInstance.editor.createModel(currentContent, 'json'),
          modified: monacoInstance.editor.createModel(currentContent, 'json')
        })
      }
    } else {
      // Switch to normal editor
      currentEditor.value = await createEditor(container, {
        value: currentContent
      })
    }
  }
  
  /**
   * Get current editor content
   * 
   * @param {string} editorType - 'original', 'modified', or undefined for current
   * @returns {string} Editor content
   */
  const getEditorContent = (editorType) => {
    if (isDiffMode.value && currentDiffEditor.value) {
      if (editorType === 'original') {
        return currentDiffEditor.value.getOriginalEditor().getValue()
      } else if (editorType === 'modified') {
        return currentDiffEditor.value.getModifiedEditor().getValue()
      }
      return currentDiffEditor.value.getModifiedEditor().getValue()
    }
    
    if (currentEditor.value) {
      return currentEditor.value.getValue()
    }
    
    return ''
  }
  
  /**
   * Set editor content
   * 
   * @param {string} content - Content to set
   * @param {string} editorType - 'original', 'modified', or undefined for current
   */
  const setEditorContent = (content, editorType) => {
    if (isDiffMode.value && currentDiffEditor.value) {
      if (editorType === 'original') {
        const editor = currentDiffEditor.value.getOriginalEditor()
        editor.setValue(content)
      } else if (editorType === 'modified') {
        const editor = currentDiffEditor.value.getModifiedEditor()
        editor.setValue(content)
      } else {
        // Set both editors
        currentDiffEditor.value.getOriginalEditor().setValue(content)
        currentDiffEditor.value.getModifiedEditor().setValue(content)
      }
    } else if (currentEditor.value) {
      currentEditor.value.setValue(content)
    }
  }
  
  /**
   * Format editor content
   * 
   * @param {string} editorType - 'original', 'modified', or undefined for current
   */
  const formatEditorContent = async (editorType) => {
    if (isDiffMode.value && currentDiffEditor.value) {
      if (editorType === 'original' || !editorType) {
        await currentDiffEditor.value.getOriginalEditor().getAction('editor.action.formatDocument').run()
      }
      if (editorType === 'modified' || !editorType) {
        await currentDiffEditor.value.getModifiedEditor().getAction('editor.action.formatDocument').run()
      }
    } else if (currentEditor.value) {
      await currentEditor.value.getAction('editor.action.formatDocument').run()
    }
  }
  
  /**
   * Resize editor to fit container
   */
  const resizeEditor = () => {
    if (currentEditor.value) {
      currentEditor.value.layout()
    }
    if (currentDiffEditor.value) {
      currentDiffEditor.value.layout()
    }
  }
  
  /**
   * Clean up current editor instances
   */
  const cleanupCurrentEditor = async () => {
    // Clean up standard editor
    if (currentEditor.value) {
      // Dispose custom event listeners
      if (currentEditor.value._customDisposables) {
        currentEditor.value._customDisposables.forEach(disposable => {
          try {
            disposable.dispose()
          } catch (error) {
            console.warn('Error disposing editor listener:', error)
          }
        })
      }
      
      // Dispose editor
      try {
        currentEditor.value.dispose()
      } catch (error) {
        console.warn('Error disposing editor:', error)
      }
      
      currentEditor.value = null
    }
    
    // Clean up diff editor
    if (currentDiffEditor.value) {
      // Dispose custom event listeners
      if (currentDiffEditor.value._customDisposables) {
        currentDiffEditor.value._customDisposables.forEach(disposable => {
          try {
            disposable.dispose()
          } catch (error) {
            console.warn('Error disposing diff editor listener:', error)
          }
        })
      }
      
      // Dispose diff editor
      try {
        currentDiffEditor.value.dispose()
      } catch (error) {
        console.warn('Error disposing diff editor:', error)
      }
      
      currentDiffEditor.value = null
    }
  }
  
  /**
   * Cleanup function for component unmount
   */
  const cleanup = async () => {
    await cleanupCurrentEditor()
    monacoInstance = null
    isInitialized.value = false
  }
  
  // Cleanup on component unmount
  onBeforeUnmount(cleanup)
  
  return {
    // State
    isLoading,
    isInitialized,
    isDiffMode,
    currentEditor,
    currentDiffEditor,
    
    // Methods
    initializeEditor,
    toggleDiffMode,
    getEditorContent,
    setEditorContent,
    formatEditorContent,
    resizeEditor,
    cleanup
  }
}
/*
 * Shared helper to configure @monaco-editor/loader with lazily imported Monaco.
 */

let isConfigured = false

/**
 * Configure the provided @monaco-editor/loader instance.
 * Uses dynamic imports so Monaco is loaded only when editor is initialized.
 */
async function configureMonacoLoader(loaderInstance) {
  if (isConfigured || !loaderInstance || typeof loaderInstance.config !== 'function') return

  try {
    const monaco = await import('monaco-editor/esm/vs/editor/editor.api')
    await import('monaco-editor/esm/vs/editor/contrib/contextmenu/browser/contextmenu')
    await import('monaco-editor/esm/vs/editor/contrib/format/browser/formatActions')
    await import('monaco-editor/esm/vs/language/json/monaco.contribution')

    loaderInstance.config({ monaco })
    isConfigured = true
  } catch (e) {
    // don't throw; let caller handle init errors
    // eslint-disable-next-line no-console
    console.warn('monacoLoader: failed to configure loader', e)
  }
}

export { configureMonacoLoader }

/*
 * Monaco loader for Vite using ESM + web workers.
 * Avoids CDN/AMD runtime coupling and keeps Monaco version aligned with package.json.
 */

let monacoPromise = null

async function loadMonaco() {
  if (monacoPromise) return monacoPromise

  monacoPromise = (async () => {
    try {
      const monaco = await import('monaco-editor/esm/vs/editor/editor.api')
      const { default: EditorWorker } = await import('monaco-editor/esm/vs/editor/editor.worker?worker')
      const { default: JsonWorker } = await import('monaco-editor/esm/vs/language/json/json.worker?worker')
      await import('monaco-editor/esm/vs/language/json/monaco.contribution')

      globalThis.MonacoEnvironment = {
        getWorker(_, label) {
          if (label === 'json') {
            return new JsonWorker()
          }
          return new EditorWorker()
        }
      }

      monaco.languages?.json?.jsonDefaults?.setModeConfiguration?.({
        documentFormattingEdits: true,
        documentRangeFormattingEdits: true,
        completionItems: true,
        hovers: true,
        documentSymbols: true,
        tokens: true,
        colors: true,
        foldingRanges: true,
        diagnostics: true,
        selectionRanges: true
      })

      return monaco
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('monacoLoader: failed to initialize Monaco', e)
      throw e
    }
  })()

  return monacoPromise
}

export { loadMonaco }

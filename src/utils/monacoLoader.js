/*
 * Shared helper to configure @monaco-editor/loader paths based on environment.
 */

const DEFAULT_VERSION = '0.52.2'

/**
 * Configure the provided @monaco-editor/loader instance with a preferred `vs` path.
 * This is synchronous and safe to call before loader.init().
 */
function configureMonacoLoader(loaderInstance) {
  if (!loaderInstance || typeof loaderInstance.config !== 'function') return
  try {
    const monacoEditorUrl = `https://unpkg.com/monaco-editor@${DEFAULT_VERSION}/min/vs`
    loaderInstance.config({ paths: { vs: monacoEditorUrl } })
  } catch (e) {
    // don't throw; let caller handle init errors
    // eslint-disable-next-line no-console
    console.warn('monacoLoader: failed to configure loader path', e)
  }
}

export { configureMonacoLoader }

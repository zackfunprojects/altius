import { useState, useEffect, useRef, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { runJavaScript } from '../../lib/exerciseRunner'

// Dark theme matching terminal-dark (#0D0F14)
const terminalTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0D0F14',
    color: '#F4EDE0',
    fontSize: '14px',
    fontFamily: '"Courier New", monospace',
    borderRadius: '8px',
    border: '1px solid rgba(74, 222, 128, 0.15)',
  },
  '.cm-content': {
    caretColor: '#4ADE80',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#4ADE80',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  '.cm-gutters': {
    backgroundColor: '#0D0F14',
    color: 'rgba(139, 115, 85, 0.5)',
    border: 'none',
    paddingLeft: '4px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    color: '#4ADE80',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(26, 61, 124, 0.4) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(26, 61, 124, 0.5) !important',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    outline: '1px solid rgba(74, 222, 128, 0.4)',
  },
})

function getLanguageExtension(lang) {
  switch (lang) {
    case 'javascript':
    case 'js':
      return javascript()
    case 'python':
    case 'py':
      return python()
    case 'html':
      return html()
    default:
      return javascript()
  }
}

export default function CodeEditorLedge({ spec, onResponseChange, disabled }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const [testResults, setTestResults] = useState(null)
  const [running, setRunning] = useState(false)
  const codeRef = useRef(spec.starter_code || '')

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return

    const langExt = getLanguageExtension(spec.language)

    const startState = EditorState.create({
      doc: spec.starter_code || '',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        langExt,
        terminalTheme,
        EditorView.editable.of(!disabled),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const code = update.state.doc.toString()
            codeRef.current = code
            onResponseChange?.({ code })
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
    // Only run on mount - spec changes would require a full remount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update editable state when disabled changes
  useEffect(() => {
    if (!viewRef.current) return
    viewRef.current.dispatch({
      effects: EditorView.editable.reconfigure(EditorView.editable.of(!disabled)),
    })
  }, [disabled])

  const handleRunTests = useCallback(async () => {
    if (running || disabled) return
    setRunning(true)
    setTestResults(null)

    try {
      const results = await runJavaScript(codeRef.current, spec.test_cases || [])
      setTestResults(results)
    } catch (err) {
      setTestResults([
        {
          description: 'Runner Error',
          passed: false,
          expected: '-',
          actual: null,
          error: err.message,
        },
      ])
    } finally {
      setRunning(false)
    }
  }, [running, disabled, spec.test_cases])

  const isJavaScript =
    spec.language === 'javascript' || spec.language === 'js'

  return (
    <div className="space-y-4">
      {spec.instructions && (
        <p className="font-body text-sm text-ink/80">{spec.instructions}</p>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        className="min-h-[200px] max-h-[400px] overflow-auto rounded-lg"
      />

      {/* Run Tests button (JavaScript only) */}
      {isJavaScript && spec.test_cases?.length > 0 && (
        <button
          onClick={handleRunTests}
          disabled={running || disabled}
          className="px-4 py-2 bg-phosphor-green/15 text-phosphor-green font-mono text-sm rounded-md hover:bg-phosphor-green/25 transition-colors disabled:opacity-40 border border-phosphor-green/20"
        >
          {running ? 'Running...' : 'Run Tests'}
        </button>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="bg-terminal-dark rounded-lg border border-phosphor-green/15 p-4 space-y-2">
          <span className="font-mono text-xs text-phosphor-green/60 uppercase tracking-wider">
            Test Results
          </span>
          {testResults.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 px-3 py-2 rounded-md text-sm font-mono ${
                r.passed
                  ? 'bg-phosphor-green/10 text-phosphor-green'
                  : 'bg-signal-orange/10 text-signal-orange'
              }`}
            >
              <span className="shrink-0 mt-0.5">
                {r.passed ? '\u2713' : '\u2717'}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{r.description}</p>
                {!r.passed && (
                  <div className="text-xs mt-1 space-y-0.5 opacity-80">
                    <p>Expected: {r.expected}</p>
                    <p>
                      {r.error
                        ? `Error: ${r.error}`
                        : `Actual: ${r.actual ?? 'undefined'}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

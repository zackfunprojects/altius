/**
 * exerciseRunner.js - Sandboxed JavaScript execution for CodeEditorLedge
 *
 * Uses blob URL Web Workers for isolation. Each test case runs in its own
 * Worker with a 5-second timeout. Workers are cleaned up after each run.
 */

const WORKER_TIMEOUT_MS = 5000

const WORKER_SOURCE = `
self.onmessage = function(e) {
  const { code, input } = e.data
  try {
    const fn = new Function('input', code + '\\n//# sourceURL=exercise.js')
    const result = fn(input)
    self.postMessage({ result: String(result), error: null })
  } catch (err) {
    self.postMessage({ result: null, error: err.message })
  }
}
`

/**
 * Run a single test case in an isolated Worker.
 *
 * @param {string} code - The user's code
 * @param {*} input - Test input value
 * @returns {Promise<{result: string|null, error: string|null}>}
 */
function runSingleTest(code, input) {
  return new Promise((resolve) => {
    let worker = null
    let timer = null

    try {
      const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      worker = new Worker(url)
      URL.revokeObjectURL(url)

      timer = setTimeout(() => {
        worker.terminate()
        resolve({ result: null, error: 'Execution timed out (5s limit)' })
      }, WORKER_TIMEOUT_MS)

      worker.onmessage = (e) => {
        clearTimeout(timer)
        worker.terminate()
        resolve(e.data)
      }

      worker.onerror = (e) => {
        clearTimeout(timer)
        worker.terminate()
        resolve({ result: null, error: e.message || 'Worker error' })
      }

      worker.postMessage({ code, input })
    } catch (err) {
      if (timer) clearTimeout(timer)
      if (worker) worker.terminate()
      resolve({ result: null, error: err.message })
    }
  })
}

/**
 * Run user code against an array of test cases.
 *
 * @param {string} code - The user's JavaScript code
 * @param {Array<{input: *, expected_output: string, description: string}>} testCases
 * @returns {Promise<Array<{description: string, passed: boolean, expected: string, actual: string|null, error: string|null}>>}
 */
export async function runJavaScript(code, testCases) {
  const results = []

  for (const tc of testCases) {
    const { result, error } = await runSingleTest(code, tc.input)

    const expected = String(tc.expected_output)
    const passed = !error && result === expected

    results.push({
      description: tc.description,
      passed,
      expected,
      actual: result,
      error,
    })
  }

  return results
}

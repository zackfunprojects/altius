/**
 * Browser-side voice recording and playback utilities.
 * Uses MediaRecorder API for recording and AudioContext for playback.
 */

/**
 * Requests microphone access and starts recording audio.
 * Returns a MediaRecorder instance and a promise that resolves to the audio Blob when stopped.
 *
 * @returns {Promise<{ recorder: MediaRecorder, getBlob: () => Promise<Blob> }>}
 */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const chunks = []
  let resolveBlob

  const blobPromise = new Promise((resolve) => {
    resolveBlob = resolve
  })

  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm',
  })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  recorder.onstop = () => {
    // Stop all tracks to release the microphone
    stream.getTracks().forEach((t) => t.stop())
    resolveBlob(new Blob(chunks, { type: recorder.mimeType }))
  }

  recorder.start()

  return {
    recorder,
    getBlob: () => blobPromise,
  }
}

/**
 * Stops a MediaRecorder and returns the audio Blob.
 *
 * @param {MediaRecorder} recorder
 * @param {() => Promise<Blob>} getBlob - from startRecording
 * @returns {Promise<Blob>}
 */
export async function stopRecording(recorder, getBlob) {
  if (recorder.state === 'recording') {
    recorder.stop()
  }
  return getBlob()
}

/**
 * Converts an audio Blob to a base64 string for API transport.
 *
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Strip the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Plays audio from a base64-encoded string.
 * Returns a promise that resolves when playback completes.
 *
 * @param {string} base64 - base64-encoded audio data
 * @param {string} [mimeType='audio/mp3'] - MIME type of the audio
 * @returns {Promise<void>}
 */
export function playAudioBase64(base64, mimeType = 'audio/mp3') {
  return new Promise((resolve, reject) => {
    const bytes = atob(base64)
    const buffer = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) {
      buffer[i] = bytes.charCodeAt(i)
    }
    const blob = new Blob([buffer], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }

    audio.play()
  })
}

/**
 * Checks if the browser supports audio recording.
 * @returns {boolean}
 */
export function isRecordingSupported() {
  return !!(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined')
}

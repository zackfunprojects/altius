import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'

/**
 * Mobile voice utilities using expo-av.
 */

let recording = null

export async function startRecording() {
  const { granted } = await Audio.requestPermissionsAsync()
  if (!granted) {
    throw new Error('Microphone permission is required for voice features.')
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  })

  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  )
  recording = rec
  return rec
}

export async function stopRecording() {
  if (!recording) return null

  try {
    await recording.stopAndUnloadAsync()
  } catch {
    // Already stopped - safe to proceed
  }

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false })

  const uri = recording.getURI()
  recording = null
  return uri
}

export async function audioFileToBase64(uri) {
  if (!uri) throw new Error('No audio URI provided')
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  return base64
}

export async function playAudioBase64(base64) {
  if (!base64) return

  const fileUri = FileSystem.cacheDirectory + `sherpa_response_${Date.now()}.mp3`
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const { sound } = await Audio.Sound.createAsync({ uri: fileUri })

  try {
    await sound.playAsync()

    await new Promise((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          resolve()
        }
      })
    })
  } finally {
    await sound.unloadAsync()
  }
}

export function isRecordingSupported() {
  return true
}

import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'

/**
 * Mobile voice utilities using expo-av.
 */

let recording = null

export async function startRecording() {
  await Audio.requestPermissionsAsync()
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
  await recording.stopAndUnloadAsync()
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false })

  const uri = recording.getURI()
  recording = null
  return uri
}

export async function audioFileToBase64(uri) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  return base64
}

export async function playAudioBase64(base64) {
  const fileUri = FileSystem.cacheDirectory + 'sherpa_response.mp3'
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const { sound } = await Audio.Sound.createAsync({ uri: fileUri })
  await sound.playAsync()

  return new Promise((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync()
        resolve()
      }
    })
  })
}

export function isRecordingSupported() {
  return true // expo-av always supports recording on native
}

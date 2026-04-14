import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { topo, fonts, colors } from '../lib/theme'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (loading || !email.trim() || !password.trim()) return
    setLoading(true)
    setError(null)

    const { error: authError } = isSignUp
      ? await signUp(email.trim(), password, displayName.trim())
      : await signIn(email.trim(), password)

    if (authError) setError(authError.message)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.wordmark}>ALTIUS</Text>
        <Text style={styles.subtitle}>POCKET</Text>

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Display name"
            placeholderTextColor={topo.textDim}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={topo.textDim}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={topo.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Connecting...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(null) }}>
          <Text style={styles.toggle}>
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  wordmark: { fontFamily: fonts.mono, fontSize: 32, color: topo.text, textAlign: 'center', letterSpacing: 8 },
  subtitle: { fontFamily: fonts.mono, fontSize: 12, color: topo.textMuted, textAlign: 'center', letterSpacing: 4, marginBottom: 40 },
  input: {
    borderWidth: 1, borderColor: topo.border, borderRadius: 8,
    padding: 14, fontFamily: fonts.mono, fontSize: 14,
    color: topo.text, backgroundColor: 'rgba(26,61,124,0.05)',
    marginBottom: 12,
  },
  error: { fontFamily: fonts.mono, fontSize: 12, color: colors.signalOrange, marginBottom: 12 },
  button: {
    backgroundColor: colors.summitCobalt, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.mono, fontSize: 14, color: '#fff', fontWeight: '600' },
  toggle: { fontFamily: fonts.mono, fontSize: 12, color: topo.textMuted, textAlign: 'center', marginTop: 20 },
})

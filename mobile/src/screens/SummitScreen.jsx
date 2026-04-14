import { useState, useCallback } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { useProfile } from '../hooks/useProfile'
import { evaluateSummit } from '../lib/sherpa'
import { completeTrek } from '../lib/trek'
import { topo, fonts, colors } from '../lib/theme'
import PocketHeader from '../components/brand/PocketHeader'
import TopoBorder from '../components/brand/TopoBorder'

export default function SummitScreen({ navigation }) {
  const { profile } = useProfile()
  const { trek } = useActiveTrek()
  const [deliverableText, setDeliverableText] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState(null)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState(null)

  const summitChallenge = trek?.summit_challenge || {}

  const handleSubmit = useCallback(async () => {
    if (!trek?.id || !deliverableText.trim() || evaluating) return
    setEvaluating(true)
    setError(null)
    try {
      const evaluation = await evaluateSummit({
        trekId: trek.id,
        deliverableText: deliverableText.trim(),
      })
      setResult(evaluation)
    } catch (err) {
      setError(err.message)
    } finally {
      setEvaluating(false)
    }
  }, [trek, deliverableText, evaluating])

  const handleRecord = useCallback(async () => {
    if (!trek?.id || recording) return
    setRecording(true)
    try {
      await completeTrek(trek.id)
      navigation.navigate('Notebook')
    } catch (err) {
      setError(err.message)
      setRecording(false)
    }
  }, [trek, recording, navigation])

  return (
    <View style={styles.container}>
      <PocketHeader title="Summit Challenge" elevation={profile?.current_elevation || 0} showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!result ? (
          <View>
            <TopoBorder style={{ marginBottom: 16 }}>
              <Text style={styles.label}>THE CHALLENGE</Text>
              <Text style={styles.description}>
                {summitChallenge.description || 'Demonstrate mastery of this skill.'}
              </Text>
            </TopoBorder>

            <TextInput
              style={styles.textArea}
              placeholder="Describe what you built..."
              placeholderTextColor={topo.textDim}
              value={deliverableText}
              onChangeText={setDeliverableText}
              multiline
              maxLength={5000}
            />
            <Text style={styles.charCount}>{deliverableText.length}/5000</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryButton, (evaluating || !deliverableText.trim()) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={evaluating || !deliverableText.trim()}
            >
              {evaluating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit for Evaluation</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={[styles.score, result.passed ? styles.scorePass : styles.scoreFail]}>
              {Math.round(result.overall_score * 100)}%
            </Text>
            <Text style={[styles.verdict, result.passed ? styles.scorePass : styles.scoreFail]}>
              {result.passed ? 'Summit Reached' : 'Not Yet'}
            </Text>

            {result.dimension_scores?.map((dim, i) => (
              <TopoBorder key={i} style={{ marginBottom: 8 }}>
                <View style={styles.dimRow}>
                  <Text style={styles.dimName}>{dim.dimension}</Text>
                  <Text style={[styles.dimScore, dim.score >= 0.6 ? styles.scorePass : styles.scoreFail]}>
                    {Math.round(dim.score * 100)}%
                  </Text>
                </View>
                {dim.feedback && <Text style={styles.dimFeedback}>{dim.feedback}</Text>}
              </TopoBorder>
            ))}

            {result.summit_entry && (
              <TopoBorder style={{ marginTop: 8 }}>
                <Text style={styles.sherpaText}>&gt; {result.summit_entry}</Text>
              </TopoBorder>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            {result.passed ? (
              <TouchableOpacity
                style={[styles.successButton, recording && { opacity: 0.5 }]}
                onPress={handleRecord}
                disabled={recording}
              >
                <Text style={styles.successButtonText}>
                  {recording ? 'Recording...' : 'Record in Trek Notebook'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setResult(null)}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontFamily: fonts.mono, fontSize: 10, color: topo.textDim, letterSpacing: 2, marginBottom: 8 },
  description: { fontFamily: fonts.mono, fontSize: 13, color: topo.text, lineHeight: 20 },
  textArea: {
    borderWidth: 1, borderColor: topo.border, borderRadius: 8,
    padding: 14, fontFamily: fonts.mono, fontSize: 13,
    color: topo.text, minHeight: 120, textAlignVertical: 'top', marginBottom: 4,
  },
  charCount: { fontFamily: fonts.mono, fontSize: 10, color: topo.textDim, textAlign: 'right', marginBottom: 12 },
  error: { fontFamily: fonts.mono, fontSize: 12, color: colors.signalOrange, marginBottom: 12 },
  primaryButton: {
    backgroundColor: colors.summitCobalt, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  primaryButtonText: { fontFamily: fonts.mono, fontSize: 14, color: '#fff', fontWeight: '600' },
  successButton: {
    backgroundColor: colors.phosphorGreen, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  successButtonText: { fontFamily: fonts.mono, fontSize: 14, color: topo.bg, fontWeight: 'bold' },
  score: { fontFamily: fonts.mono, fontSize: 48, textAlign: 'center', marginBottom: 4 },
  verdict: { fontFamily: fonts.mono, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  scorePass: { color: colors.phosphorGreen },
  scoreFail: { color: colors.signalOrange },
  dimRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dimName: { fontFamily: fonts.mono, fontSize: 12, color: topo.text },
  dimScore: { fontFamily: fonts.mono, fontSize: 12, fontWeight: 'bold' },
  dimFeedback: { fontFamily: fonts.mono, fontSize: 11, color: topo.textMuted, fontStyle: 'italic' },
  sherpaText: { fontFamily: fonts.mono, fontSize: 13, color: topo.text, lineHeight: 20 },
})

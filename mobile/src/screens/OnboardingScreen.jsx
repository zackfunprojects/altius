import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { interviewForSkill, generateTrek } from '../lib/sherpa'
import { activateTrek } from '../lib/trek'
import { topo, fonts, colors } from '../lib/theme'
import TopoBorder from '../components/brand/TopoBorder'

export default function OnboardingScreen({ navigation }) {
  const { user } = useAuth()
  const { updateProfile } = useProfile()
  const [step, setStep] = useState(0)
  const [skill, setSkill] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [trekData, setTrekData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSkillSubmit = useCallback(async () => {
    if (!skill.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const qs = await interviewForSkill(skill.trim())
      setQuestions(qs)
      setStep(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [skill, loading])

  const handleAnswersSubmit = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const prereqs = questions.map((q, i) => ({
        question: q.question,
        answer: answers[i] || '',
      }))
      const data = await generateTrek({
        skillDescription: skill.trim(),
        prerequisiteAnswers: prereqs,
        userId: user.id,
      })
      setTrekData(data)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [loading, questions, answers, skill, user])

  const handleBegin = useCallback(async () => {
    if (!trekData?.trek_id || loading) return
    setLoading(true)
    setError(null)
    try {
      await activateTrek(trekData.trek_id)
      // Profile update is non-critical - don't fail the whole flow
      try {
        await updateProfile({
          expedition_origin: skill.trim(),
          expedition_vision: 'Mastery',
        })
      } catch {
        // Trek is active, proceed even if profile update fails
      }
      navigation.replace('Main')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [trekData, loading, skill, updateProfile, navigation])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {step === 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>What do you want to learn?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Making SaaS launch videos"
            placeholderTextColor={topo.textDim}
            value={skill}
            onChangeText={setSkill}
            multiline
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleSkillSubmit} disabled={loading || !skill.trim()}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.heading}>A few questions first</Text>
          {questions.map((q, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <Text style={styles.question}>{q.question}</Text>
              <TextInput
                style={styles.input}
                placeholder="Your answer..."
                placeholderTextColor={topo.textDim}
                value={answers[i] || ''}
                onChangeText={(t) => setAnswers({ ...answers, [i]: t })}
                multiline
              />
            </View>
          ))}
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleAnswersSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Trek</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && trekData && (
        <View style={styles.section}>
          <Text style={styles.heading}>{trekData.trek_name}</Text>
          <Text style={styles.meta}>{trekData.difficulty} - {trekData.estimated_duration}</Text>
          {trekData.camps?.map((camp, i) => (
            <TopoBorder key={i} style={{ marginBottom: 8 }}>
              <Text style={styles.campName}>Camp {camp.camp_number}: {camp.camp_name}</Text>
              {camp.learning_objectives?.slice(0, 2).map((obj, j) => (
                <Text key={j} style={styles.objective}>{obj}</Text>
              ))}
            </TopoBorder>
          ))}
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleBegin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Begin the Trek</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  content: { padding: 24, paddingTop: 60 },
  section: { flex: 1 },
  heading: { fontFamily: fonts.mono, fontSize: 20, color: topo.text, marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: topo.border, borderRadius: 8,
    padding: 14, fontFamily: fonts.mono, fontSize: 14,
    color: topo.text, marginBottom: 12, minHeight: 60, textAlignVertical: 'top',
  },
  question: { fontFamily: fonts.mono, fontSize: 13, color: topo.textMuted, marginBottom: 8 },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: topo.textMuted, marginBottom: 16 },
  campName: { fontFamily: fonts.mono, fontSize: 13, color: topo.text, marginBottom: 4 },
  objective: { fontFamily: fonts.mono, fontSize: 11, color: topo.textMuted },
  error: { fontFamily: fonts.mono, fontSize: 12, color: colors.signalOrange, marginBottom: 12 },
  button: {
    backgroundColor: colors.summitCobalt, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  buttonText: { fontFamily: fonts.mono, fontSize: 14, color: '#fff', fontWeight: '600' },
})

import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { useProfile } from '../hooks/useProfile'
import { generateLesson } from '../lib/sherpa'
import { completeSection } from '../lib/trek'
import { topo, fonts, colors } from '../lib/theme'
import PocketHeader from '../components/brand/PocketHeader'
import TopoBorder from '../components/brand/TopoBorder'

export default function LearningScreen({ navigation }) {
  const { profile } = useProfile()
  const { trek, currentSection, refetch } = useActiveTrek()
  const [lessonContent, setLessonContent] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState(null)

  // Generate lesson on section change
  useEffect(() => {
    if (!currentSection?.id || currentSection.content) {
      setLessonContent(currentSection?.content || null)
      return
    }
    let cancelled = false
    async function generate() {
      setGenerating(true)
      setError(null)
      try {
        const content = await generateLesson({ sectionId: currentSection.id })
        if (!cancelled) setLessonContent(content)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [currentSection?.id, currentSection?.content])

  const handleComplete = useCallback(async () => {
    if (!currentSection || completing) return
    setCompleting(true)
    try {
      await completeSection(currentSection.id)
      setLessonContent(null)
      await refetch()
    } catch (err) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }, [currentSection, completing, refetch])

  return (
    <View style={styles.container}>
      <PocketHeader
        title={trek?.trek_name || 'Learning'}
        elevation={profile?.current_elevation || 0}
        showBack
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {generating ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>&gt; Preparing your trail...</Text>
            <ActivityIndicator color={colors.phosphorGreen} style={{ marginTop: 12 }} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !currentSection ? (
          <View style={styles.center}>
            <Text style={styles.headingText}>All sections complete</Text>
            <Text style={styles.subText}>The summit challenge awaits.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Summit')}
            >
              <Text style={styles.primaryButtonText}>Attempt Summit</Text>
            </TouchableOpacity>
          </View>
        ) : lessonContent?.narrative ? (
          <View>
            <Text style={styles.sectionTitle}>{currentSection.title}</Text>

            {lessonContent.narrative.map((block, i) => (
              <TopoBorder key={i} style={{ marginBottom: 12 }}>
                {block.type === 'sherpa_text' && (
                  <Text style={styles.sherpaText}>&gt; {block.content}</Text>
                )}
                {block.type === 'exercise' && (
                  <View>
                    <Text style={styles.exerciseLabel}>EXERCISE</Text>
                    <Text style={styles.sherpaText}>{block.spec?.prompt || 'Complete this exercise.'}</Text>
                  </View>
                )}
                {block.type !== 'sherpa_text' && block.type !== 'exercise' && (
                  <Text style={styles.sherpaText}>{block.content || block.narration || JSON.stringify(block).slice(0, 200)}</Text>
                )}
              </TopoBorder>
            ))}

            <TouchableOpacity
              style={[styles.primaryButton, completing && { opacity: 0.5 }]}
              onPress={handleComplete}
              disabled={completing}
            >
              <Text style={styles.primaryButtonText}>
                {completing ? 'Completing...' : 'Complete Section'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.loadingText}>&gt; Loading content...</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { fontFamily: fonts.mono, fontSize: 14, color: topo.textMuted },
  errorText: { fontFamily: fonts.mono, fontSize: 13, color: colors.signalOrange, textAlign: 'center', marginBottom: 12 },
  headingText: { fontFamily: fonts.mono, fontSize: 20, color: topo.text, marginBottom: 8 },
  subText: { fontFamily: fonts.mono, fontSize: 13, color: topo.textMuted, marginBottom: 24 },
  sectionTitle: { fontFamily: fonts.mono, fontSize: 16, color: topo.text, marginBottom: 16 },
  sherpaText: { fontFamily: fonts.mono, fontSize: 13, color: topo.text, lineHeight: 20 },
  exerciseLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.alpineGold, letterSpacing: 2, marginBottom: 6 },
  primaryButton: {
    backgroundColor: colors.summitCobalt, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  primaryButtonText: { fontFamily: fonts.mono, fontSize: 14, color: '#fff', fontWeight: '600' },
  retryButton: {
    backgroundColor: colors.signalOrange, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  retryButtonText: { fontFamily: fonts.mono, fontSize: 13, color: '#fff' },
})

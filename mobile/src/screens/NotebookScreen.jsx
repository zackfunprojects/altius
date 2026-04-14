import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useProfile } from '../hooks/useProfile'
import { useTrekNotebook } from '../hooks/useTrekNotebook'
import { topo, fonts, colors } from '../lib/theme'
import PocketHeader from '../components/brand/PocketHeader'
import TopoBorder from '../components/brand/TopoBorder'

export default function NotebookScreen() {
  const { profile } = useProfile()
  const { entries, loading } = useTrekNotebook()

  return (
    <View style={styles.container}>
      <PocketHeader title="Trek Notebook" elevation={profile?.current_elevation || 0} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.loading}>&gt; Loading notebook...</Text>
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>&gt; No summits yet.</Text>
            <Text style={styles.emptySubtext}>&gt; The notebook waits for your first skill.</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TopoBorder key={entry.id} style={{ marginBottom: 12 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { borderColor: entry.skill_badge?.color || colors.summitCobalt }]}>
                  <Text style={[styles.badgeText, { color: entry.skill_badge?.color || colors.summitCobalt }]}>
                    {entry.skill_badge?.icon?.charAt(0)?.toUpperCase() || 'S'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.skillName}>{entry.skill_badge?.label || entry.skill_name}</Text>
                  <Text style={styles.meta}>Day {entry.summit_date}</Text>
                </View>
              </View>

              {entry.summit_entry && (
                <Text style={styles.summitEntry}>{entry.summit_entry}</Text>
              )}

              {entry.key_concepts?.length > 0 && (
                <View style={styles.conceptsRow}>
                  {entry.key_concepts.slice(0, 6).map((c, i) => (
                    <View key={i} style={styles.conceptPill}>
                      <Text style={styles.conceptText}>{c}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TopoBorder>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  loading: { fontFamily: fonts.mono, fontSize: 14, color: topo.textMuted, textAlign: 'center', marginTop: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontFamily: fonts.mono, fontSize: 16, color: topo.text, marginBottom: 8 },
  emptySubtext: { fontFamily: fonts.mono, fontSize: 12, color: topo.textMuted },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  badge: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.mono, fontSize: 14, fontWeight: 'bold' },
  skillName: { fontFamily: fonts.mono, fontSize: 15, color: topo.text },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: topo.textMuted },
  summitEntry: { fontFamily: fonts.mono, fontSize: 12, color: topo.textMuted, fontStyle: 'italic', lineHeight: 18, marginBottom: 10 },
  conceptsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  conceptPill: {
    borderWidth: 1, borderColor: topo.border, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  conceptText: { fontFamily: fonts.mono, fontSize: 10, color: topo.textMuted },
})

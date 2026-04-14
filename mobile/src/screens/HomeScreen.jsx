import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useProfile } from '../hooks/useProfile'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { topo, fonts, colors } from '../lib/theme'
import PocketHeader from '../components/brand/PocketHeader'
import TopoBorder from '../components/brand/TopoBorder'

export default function HomeScreen({ navigation }) {
  const { profile } = useProfile()
  const { trek, camps, loading } = useActiveTrek()

  return (
    <View style={styles.container}>
      <PocketHeader title="ALTIUS" elevation={profile?.current_elevation || 0} />

      <View style={styles.content}>
        {loading ? (
          <Text style={styles.loading}>&gt; Scanning the ridge...</Text>
        ) : trek ? (
          <View style={styles.trekInfo}>
            <Text style={styles.trekName}>{trek.trek_name}</Text>
            <Text style={styles.meta}>{trek.difficulty} - {trek.estimated_duration}</Text>

            <TopoBorder style={{ marginTop: 16 }}>
              <Text style={styles.sectionLabel}>CAMP PROGRESS</Text>
              {(camps || []).map((camp) => (
                <View key={camp.id} style={styles.campRow}>
                  <View style={[
                    styles.campDot,
                    camp.status === 'completed' && styles.campDotComplete,
                    camp.status === 'active' && styles.campDotActive,
                  ]} />
                  <Text style={[
                    styles.campText,
                    camp.status === 'completed' && styles.campTextComplete,
                    camp.status === 'active' && styles.campTextActive,
                  ]}>
                    {camp.camp_name}
                  </Text>
                </View>
              ))}
            </TopoBorder>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Learning')}
            >
              <Text style={styles.primaryButtonText}>Continue Trek</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <Text style={styles.secondaryButtonText}>Talk to the Sherpa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>&gt; The mountain waits.</Text>
            <Text style={styles.emptySubtext}>&gt; No active trek.</Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <Text style={styles.secondaryButtonText}>Talk to the Sherpa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  content: { flex: 1, padding: 20 },
  loading: { fontFamily: fonts.mono, fontSize: 14, color: topo.textMuted, textAlign: 'center', marginTop: 40 },
  trekInfo: { flex: 1 },
  trekName: { fontFamily: fonts.mono, fontSize: 22, color: topo.text, marginBottom: 4 },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: topo.textMuted, marginBottom: 8 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 10, color: topo.textDim, letterSpacing: 2, marginBottom: 8 },
  campRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  campDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(139,115,85,0.3)' },
  campDotComplete: { backgroundColor: colors.phosphorGreen },
  campDotActive: { backgroundColor: colors.summitCobalt },
  campText: { fontFamily: fonts.mono, fontSize: 12, color: topo.textDim },
  campTextComplete: { color: topo.textMuted, textDecorationLine: 'line-through' },
  campTextActive: { color: topo.text },
  primaryButton: {
    backgroundColor: colors.summitCobalt, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  primaryButtonText: { fontFamily: fonts.mono, fontSize: 14, color: '#fff', fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1, borderColor: topo.border, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  secondaryButtonText: { fontFamily: fonts.mono, fontSize: 14, color: topo.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: fonts.mono, fontSize: 18, color: topo.text, marginBottom: 8 },
  emptySubtext: { fontFamily: fonts.mono, fontSize: 13, color: topo.textMuted, marginBottom: 24 },
})

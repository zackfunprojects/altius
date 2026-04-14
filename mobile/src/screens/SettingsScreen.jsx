import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { getExpeditionDay } from '../lib/expedition'
import { getSubscriptionStatus } from '../lib/stripe'
import { topo, fonts, colors } from '../lib/theme'
import PocketHeader from '../components/brand/PocketHeader'
import TopoBorder from '../components/brand/TopoBorder'

export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuth()
  const { profile, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)

  const sub = getSubscriptionStatus(profile)
  const expeditionDay = getExpeditionDay(profile?.created_at)

  const handleSave = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      await updateProfile({ display_name: displayName.trim() })
    } catch {
      // Silent
    } finally {
      setSaving(false)
    }
  }, [displayName, saving, updateProfile])

  const handleSignOut = useCallback(async () => {
    const { error } = await signOut()
    if (!error) navigation.replace('Auth')
  }, [signOut, navigation])

  return (
    <View style={styles.container}>
      <PocketHeader title="Settings" elevation={profile?.current_elevation || 0} showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile */}
        <Text style={styles.sectionTitle}>PROFILE</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || '-'}</Text>

        <Text style={styles.label}>Display Name</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>SUBSCRIPTION</Text>
        <TopoBorder>
          <View style={styles.row}>
            <Text style={styles.tierBadge(sub.tier)}>
              {sub.label}
            </Text>
          </View>
          {sub.tier === 'free' && (
            <Text style={styles.freeNote}>
              Free: 1 trek, Day Hike only, 3 notebook entries.
            </Text>
          )}
        </TopoBorder>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>EXPEDITION</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.current_elevation?.toLocaleString() || 0}</Text>
            <Text style={styles.statLabel}>ft</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.total_treks_completed || 0}</Text>
            <Text style={styles.statLabel}>summits</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{expeditionDay}</Text>
            <Text style={styles.statLabel}>day</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontFamily: fonts.mono, fontSize: 10, color: topo.textDim, letterSpacing: 2, marginBottom: 12 },
  label: { fontFamily: fonts.mono, fontSize: 12, color: topo.textMuted, marginBottom: 4, marginTop: 12 },
  value: { fontFamily: fonts.mono, fontSize: 13, color: topo.text },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: topo.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.mono, fontSize: 13, color: topo.text,
  },
  saveButton: {
    backgroundColor: colors.summitCobalt, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  saveText: { fontFamily: fonts.mono, fontSize: 13, color: '#fff' },
  tierBadge: (tier) => ({
    fontFamily: fonts.mono, fontSize: 12, fontWeight: 'bold',
    color: tier === 'pro' ? colors.phosphorGreen : topo.textMuted,
    padding: 4,
  }),
  freeNote: { fontFamily: fonts.mono, fontSize: 11, color: topo.textMuted, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  stat: {
    flex: 1, alignItems: 'center',
    borderWidth: 1, borderColor: topo.border, borderRadius: 8, padding: 12,
  },
  statValue: { fontFamily: fonts.mono, fontSize: 20, color: topo.text, fontWeight: 'bold' },
  statLabel: { fontFamily: fonts.mono, fontSize: 10, color: topo.textMuted },
  signOutButton: {
    borderWidth: 1, borderColor: colors.signalOrange + '40',
    borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  signOutText: { fontFamily: fonts.mono, fontSize: 14, color: colors.signalOrange },
})

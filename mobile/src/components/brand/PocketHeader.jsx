import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { topo, fonts } from '../../lib/theme'
import ElevationCounter from './ElevationCounter'

export default function PocketHeader({ title, elevation = 0, showBack = false }) {
  const navigation = useNavigation()

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>&larr;</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>{title || 'ALTIUS'}</Text>
      </View>
      <ElevationCounter elevation={elevation} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: topo.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: topo.textMuted,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: topo.text,
    flex: 1,
  },
})

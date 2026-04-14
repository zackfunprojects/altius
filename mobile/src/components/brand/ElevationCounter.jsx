import { Text, View } from 'react-native'
import { colors, fonts } from '../../lib/theme'

export default function ElevationCounter({ elevation = 0 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.phosphorGreen }}>
        ▲
      </Text>
      <Text style={{ fontFamily: fonts.mono, fontSize: 14, fontWeight: 'bold', color: colors.phosphorGreen }}>
        {elevation.toLocaleString()} ft
      </Text>
    </View>
  )
}

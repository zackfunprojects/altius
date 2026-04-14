import { View, StyleSheet } from 'react-native'
import { topo } from '../../lib/theme'

export default function TopoBorder({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: topo.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: topo.card,
  },
})

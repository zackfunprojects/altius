/**
 * Altius Pocket - Topo GPS device visual register.
 * Terminal dark, topographic grid lines, contour lines in muted cobalt.
 */

export const colors = {
  summitCobalt: '#1A3D7C',
  fitzViolet: '#5C2D82',
  signalOrange: '#D9511C',
  alpineGold: '#D4960B',
  ink: '#1C1814',
  darkEarth: '#2C2418',
  trailBrown: '#8B7355',
  catalogCream: '#F4EDE0',
  terminalDark: '#0D0F14',
  phosphorGreen: '#4ADE80',
}

export const fonts = {
  mono: 'Courier New',
  display: 'System', // Use system serif on mobile
  body: 'System',
  ui: 'System',
}

// Topo register: everything is terminal dark with phosphor green
export const topo = {
  bg: colors.terminalDark,
  text: colors.phosphorGreen,
  textMuted: 'rgba(74, 222, 128, 0.5)',
  textDim: 'rgba(74, 222, 128, 0.3)',
  border: 'rgba(26, 61, 124, 0.3)', // muted cobalt
  accent: colors.summitCobalt,
  warning: colors.signalOrange,
  gold: colors.alpineGold,
  card: 'rgba(26, 61, 124, 0.1)',
}

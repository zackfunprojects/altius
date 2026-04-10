/**
 * Deterministic geometry helpers for the Trail View mountain scene.
 * All functions are pure - same inputs always produce same outputs.
 */

const DEFAULT_WIDTH = 1000
const DEFAULT_HEIGHT = 600

// Layer base Y positions (higher = closer to bottom = closer to viewer)
const LAYER_BASE = [280, 340, 400]
// Layer peak amplitudes (far mountains are smaller, near are taller)
const LAYER_AMP = [120, 160, 180]

/**
 * Simple deterministic hash for seeding peak positions.
 * Returns a value between 0 and 1.
 */
function hash(x, seed = 0) {
  const n = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453
  return n - Math.floor(n)
}

/**
 * Generates an SVG path string for a mountain silhouette.
 *
 * @param {string} peakStyle - sharp | flowing | rolling | layered | varied
 * @param {number} layerIndex - 0 (far), 1 (mid), 2 (near)
 * @param {number} width
 * @param {number} height
 * @returns {string} SVG path d attribute
 */
export function generateMountainPath(peakStyle, layerIndex, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  const baseY = LAYER_BASE[layerIndex] || 360
  const amp = LAYER_AMP[layerIndex] || 150
  const seed = layerIndex * 7 + 3

  const points = []
  const steps = 200

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    const t = i / steps
    let y

    switch (peakStyle) {
      case 'sharp':
        y = baseY - amp * sharpProfile(t, seed)
        break
      case 'flowing':
        y = baseY - amp * flowingProfile(t, seed)
        break
      case 'rolling':
        y = baseY - amp * rollingProfile(t, seed)
        break
      case 'layered':
        y = baseY - amp * layeredProfile(t, seed)
        break
      case 'varied':
      default:
        y = baseY - amp * variedProfile(t, seed)
        break
    }

    points.push({ x, y })
  }

  // Build the path: move to first point, line through all, close at bottom
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`
  }
  d += ` L ${width} ${height} L 0 ${height} Z`

  return d
}

// Sharp: triangle waves with varied amplitudes
function sharpProfile(t, seed) {
  const peaks = 6
  let y = 0
  for (let p = 0; p < peaks; p++) {
    const center = (p + 0.5) / peaks
    const w = 0.08 + hash(p, seed) * 0.06
    const h = 0.3 + hash(p + 10, seed) * 0.7
    const dist = Math.abs(t - center)
    if (dist < w) {
      y = Math.max(y, h * (1 - dist / w))
    }
  }
  // Add a dominant central peak
  const mainDist = Math.abs(t - 0.45)
  if (mainDist < 0.15) {
    y = Math.max(y, 0.95 * (1 - mainDist / 0.15))
  }
  return y
}

// Flowing: smooth cubic bezier-like curves
function flowingProfile(t, seed) {
  const a1 = 0.6 + hash(1, seed) * 0.3
  const a2 = 0.4 + hash(2, seed) * 0.3
  const a3 = 0.3 + hash(3, seed) * 0.2
  return (
    a1 * Math.pow(Math.sin(t * Math.PI), 1.5) +
    a2 * Math.pow(Math.sin(t * Math.PI * 1.3 + 0.5), 2) * 0.5 +
    a3 * Math.pow(Math.sin(t * Math.PI * 0.7 + 1), 2) * 0.3
  ) * 0.85
}

// Rolling: overlaid sine waves
function rollingProfile(t, seed) {
  const f1 = 2 + hash(1, seed)
  const f2 = 3.5 + hash(2, seed) * 2
  const f3 = 6 + hash(3, seed) * 3
  return (
    0.45 * Math.sin(t * Math.PI * f1) +
    0.3 * Math.sin(t * Math.PI * f2 + 1) +
    0.15 * Math.sin(t * Math.PI * f3 + 2)
  ) * 0.7 + 0.3 * Math.sin(t * Math.PI)
}

// Layered: flat plateaus with sharp drops (strata)
function layeredProfile(t, seed) {
  const terraces = 5
  let y = 0
  for (let i = 0; i < terraces; i++) {
    const start = i / terraces + hash(i, seed) * 0.05
    const end = (i + 0.8) / terraces + hash(i + 5, seed) * 0.05
    const h = 0.2 + hash(i + 10, seed) * 0.6
    if (t >= start && t <= end) {
      // Smooth edges with sigmoid-like ramps
      const rampIn = Math.min(1, (t - start) * 20)
      const rampOut = Math.min(1, (end - t) * 20)
      y = Math.max(y, h * rampIn * rampOut)
    }
  }
  // Envelope to create a mountain shape overall
  const envelope = Math.sin(t * Math.PI) * 0.9
  return y * envelope + envelope * 0.2
}

// Varied: mix of sharp peaks and rolling sections
function variedProfile(t, seed) {
  const sharp = sharpProfile(t, seed + 5)
  const rolling = rollingProfile(t, seed + 10)
  // Blend: sharp in the middle, rolling on edges
  const blend = Math.pow(Math.sin(t * Math.PI), 0.5)
  return sharp * blend + rolling * (1 - blend) * 0.7
}

/**
 * Generates a snow cap path for the foreground mountain peaks.
 * Returns an SVG path string or null if no peaks are prominent enough.
 */
export function generateSnowCapPath(peakStyle, width = DEFAULT_WIDTH) {
  const layerIndex = 2 // foreground
  const baseY = LAYER_BASE[layerIndex]
  const amp = LAYER_AMP[layerIndex]
  const seed = layerIndex * 7 + 3
  const threshold = baseY - amp * 0.7 // Only snow on top 30% of peaks

  const steps = 200
  const snowPoints = []
  let inSnow = false
  let sectionStartX = null

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    const t = i / steps
    let y

    switch (peakStyle) {
      case 'sharp': y = baseY - amp * sharpProfile(t, seed); break
      case 'flowing': y = baseY - amp * flowingProfile(t, seed); break
      case 'rolling': y = baseY - amp * rollingProfile(t, seed); break
      case 'layered': y = baseY - amp * layeredProfile(t, seed); break
      default: y = baseY - amp * variedProfile(t, seed); break
    }

    if (y < threshold) {
      if (!inSnow) {
        snowPoints.push(`M ${x} ${y}`)
        inSnow = true
        sectionStartX = x
      } else {
        snowPoints.push(`L ${x} ${y}`)
      }
    } else if (inSnow) {
      // Close this snow section as a filled polygon
      snowPoints.push(`L ${x} ${threshold}`)
      snowPoints.push(`L ${sectionStartX} ${threshold} Z`)
      inSnow = false
      sectionStartX = null
    }
  }

  // Close any trailing open snow segment
  if (inSnow && sectionStartX !== null) {
    snowPoints.push(`L ${width} ${threshold}`)
    snowPoints.push(`L ${sectionStartX} ${threshold} Z`)
  }

  return snowPoints.length > 2 ? snowPoints.join(' ') : null
}

/**
 * Computes camp positions along a trail from basecamp (lower-right) to summit (upper-left).
 *
 * @param {number} numCamps
 * @param {string} trailStyle - precise | winding | meandering | switchback | direct
 * @param {number} width
 * @param {number} height
 * @returns {Array<{x: number, y: number}>}
 */
export function computeCampPositions(numCamps, trailStyle, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  if (numCamps <= 0) return []
  if (numCamps === 1) return [{ x: width * 0.5, y: height * 0.45 }]

  const start = { x: width * 0.82, y: height * 0.72 }
  const end = { x: width * 0.2, y: height * 0.18 }

  const positions = []

  for (let i = 0; i < numCamps; i++) {
    const t = i / (numCamps - 1) // 0 to 1

    // Base linear interpolation
    let x = start.x + (end.x - start.x) * t
    let y = start.y + (end.y - start.y) * t

    // Apply trail style offsets
    switch (trailStyle) {
      case 'winding': {
        // S-curve lateral offset
        const offset = Math.sin(t * Math.PI * 2) * width * 0.08
        x += offset
        break
      }
      case 'switchback': {
        // Zigzag: alternate left and right
        const direction = i % 2 === 0 ? 1 : -1
        x += direction * width * 0.1 * Math.sin(t * Math.PI)
        break
      }
      case 'meandering': {
        // Organic offsets using hash
        x += (hash(i, 42) - 0.5) * width * 0.12
        y += (hash(i, 99) - 0.5) * height * 0.04
        break
      }
      case 'direct': {
        // Steeper, more vertical - compress X range
        x = start.x + (end.x - start.x) * t * 0.7 + width * 0.1
        break
      }
      case 'precise':
      default:
        // Nearly straight line - already correct
        break
    }

    // Clamp within scene bounds with margin
    x = Math.max(width * 0.08, Math.min(width * 0.92, x))
    y = Math.max(height * 0.1, Math.min(height * 0.8, y))

    positions.push({ x, y })
  }

  return positions
}

/**
 * Generates an SVG trail path connecting camp positions with curves.
 * @param {Array<{x: number, y: number}>} positions
 * @returns {string} SVG path d attribute
 */
export function generateTrailPath(positions) {
  if (positions.length < 2) return ''

  let d = `M ${positions[0].x} ${positions[0].y}`

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1]
    const curr = positions[i]
    // Quadratic bezier with control point offset for organic curve
    const cpx = (prev.x + curr.x) / 2 + (i % 2 === 0 ? 15 : -15)
    const cpy = (prev.y + curr.y) / 2
    d += ` Q ${cpx} ${cpy} ${curr.x} ${curr.y}`
  }

  return d
}

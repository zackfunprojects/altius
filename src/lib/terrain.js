/**
 * Computes visual terrain parameters for a trek based on its skill domain.
 * These params drive the visual appearance of the trail map and mountain scene.
 * No AI call needed - keyword matching on skill description.
 */

// Keywords must be 3+ characters to avoid false positives with word-boundary matching.
// Multi-word phrases are preferred for precision.
const DOMAIN_KEYWORDS = {
  technical: [
    'programming', 'python', 'javascript', 'code', 'coding', 'software', 'engineering',
    'database', 'sql', 'algorithm', 'data structure', 'web development',
    'react', 'node', 'typescript', 'devops', 'cloud', 'docker', 'kubernetes',
    'machine learning', 'artificial intelligence', 'cybersecurity',
    'linux', 'html', 'backend', 'frontend', 'fullstack', 'compiler',
    'server', 'deploy', 'debug', 'terminal', 'command line',
  ],
  creative: [
    'design', 'illustration', 'photography', 'video', 'animation', 'motion graphics',
    'graphic design', 'figma', 'photoshop', 'drawing', 'painting',
    'music production', 'composition', 'film', 'cinematography', 'video editing',
    'color theory', 'typography', 'branding', 'logo design', 'creative writing', 'poetry',
    'launch video', 'saas video', 'visual design', 'cinema', 'sculpting',
    'ui design', 'ux design', 'motion design', 'sound design',
  ],
  communication: [
    'writing', 'speaking', 'presentation', 'negotiation', 'leadership', 'management',
    'sales', 'marketing', 'public speaking', 'storytelling', 'copywriting',
    'communication', 'persuasion', 'coaching', 'mentoring', 'facilitation',
    'conflict resolution', 'interviewing', 'pitching',
    'team building', 'teaching', 'training', 'rhetoric',
  ],
  analytical: [
    'math', 'mathematics', 'statistics', 'physics', 'chemistry', 'biology',
    'history', 'philosophy', 'economics', 'finance', 'accounting', 'research',
    'data analysis', 'science', 'psychology', 'sociology',
    'law', 'legal', 'medical', 'academic', 'critical thinking',
    'logic', 'reasoning', 'strategy', 'analytics',
  ],
  practical: [
    'cooking', 'woodworking', 'gardening', 'fitness', 'yoga', 'martial arts',
    'sewing', 'knitting', 'pottery', 'carpentry', 'plumbing', 'electrical',
    'automotive', 'repair', 'crafts', 'baking', 'brewing',
    'survival', 'climbing', 'sailing', 'driving', 'guitar',
    'piano', 'drums', 'sports', 'swimming', 'running', 'welding',
  ],
}

const TERRAIN_CONFIGS = {
  technical: {
    peakStyle: 'sharp',
    geometry: 'angular',
    palette: ['#1A3D7C', '#0D0F14', '#4ADE80', '#2C2418'],
    texture: 'circuit',
    description: 'Sharp peaks, geometric ridgelines, circuit-board veins in the rock',
    trailStyle: 'precise',
    atmosphere: 'crisp',
  },
  creative: {
    peakStyle: 'flowing',
    geometry: 'organic',
    palette: ['#D9511C', '#D4960B', '#5C2D82', '#F4EDE0'],
    texture: 'watercolor',
    description: 'Color-bleed sunsets, soft geometry, warm palette, artistic rock formations',
    trailStyle: 'winding',
    atmosphere: 'warm',
  },
  communication: {
    peakStyle: 'rolling',
    geometry: 'smooth',
    palette: ['#D4960B', '#8B7355', '#F4EDE0', '#1C1814'],
    texture: 'sandstone',
    description: 'Rolling hills, warm amber light, organic paths through meadows',
    trailStyle: 'meandering',
    atmosphere: 'golden',
  },
  analytical: {
    peakStyle: 'layered',
    geometry: 'stratified',
    palette: ['#2C2418', '#8B7355', '#1A3D7C', '#5C2D82'],
    texture: 'stone',
    description: 'Ancient stone, layered strata, scholarly fog, deep ravines',
    trailStyle: 'switchback',
    atmosphere: 'misty',
  },
  practical: {
    peakStyle: 'varied',
    geometry: 'natural',
    palette: ['#8B7355', '#4ADE80', '#D4960B', '#2C2418'],
    texture: 'earth',
    description: 'Varied terrain, natural textures, earthy tones, rugged paths',
    trailStyle: 'direct',
    atmosphere: 'grounded',
  },
}

function matchesKeyword(text, keyword) {
  // Use word boundary matching to avoid false positives
  // e.g. "ui" shouldn't match "build", "ai" shouldn't match "mountain"
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\b${escaped}\\b`, 'i')
  return regex.test(text)
}

function detectDomain(text) {
  const lower = text.toLowerCase()
  let bestDomain = 'practical' // default
  let bestScore = 0

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.reduce((sum, keyword) => {
      return sum + (matchesKeyword(lower, keyword) ? 1 : 0)
    }, 0)

    if (score > bestScore) {
      bestScore = score
      bestDomain = domain
    }
  }

  return bestDomain
}

/**
 * Generates terrain parameters for a trek based on its skill description.
 * Returns a JSONB-compatible object for treks.terrain_params.
 */
export function computeTerrainParams(skillDescription, trekName = '') {
  const combined = `${skillDescription} ${trekName}`
  const domain = detectDomain(combined)
  const config = TERRAIN_CONFIGS[domain]

  return {
    domain,
    ...config,
  }
}

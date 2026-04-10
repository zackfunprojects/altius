/**
 * Calculates the behavioral weather state based on user activity patterns.
 * Weather is a visual/narrative layer that reflects how consistently the user is learning.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysSince(dateString) {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / MS_PER_DAY)
}

function entriesThisWeek(elevationLog) {
  const weekAgo = Date.now() - 7 * MS_PER_DAY
  return elevationLog.filter((e) => new Date(e.logged_at).getTime() > weekAgo)
}

function sectionsThisWeek(elevationLog) {
  return entriesThisWeek(elevationLog).filter(
    (e) => e.source_type === 'lesson_completed' || e.source_type === 'exercise_passed'
  )
}

function lastActivityDate(elevationLog) {
  if (!elevationLog.length) return null
  // Assumes elevationLog is sorted by logged_at DESC
  return elevationLog[0].logged_at
}

/**
 * Returns the current weather state for the user's expedition.
 *
 * @param {Array} elevationLog - Recent elevation log entries, sorted by logged_at DESC
 * @param {Object} profile - User profile with last_active field
 * @returns {Object} Weather state with condition, sherpaLine, and visual params
 */
export function calculateWeatherState(elevationLog) {
  const weekSections = sectionsThisWeek(elevationLog).length
  const lastActivity = lastActivityDate(elevationLog)
  const daysSinceActivity = lastActivity ? daysSince(lastActivity) : null

  // No activity ever recorded
  if (!lastActivity) {
    return {
      condition: 'calm',
      sherpaLine: 'The mountain waits. It has nowhere to be.',
      fog: 0.2,
      clearSky: true,
      snowOnPeaks: false,
      warmLight: true,
      intensity: 0.3,
    }
  }

  // Active streak - 5+ sections this week
  if (weekSections >= 5) {
    return {
      condition: 'perfect',
      sherpaLine: 'Perfect conditions. The summit has never been closer.',
      fog: 0,
      clearSky: true,
      snowOnPeaks: true,
      warmLight: false,
      intensity: 1.0,
    }
  }

  // Return after 7+ day absence
  if (daysSinceActivity >= 7 && weekSections > 0) {
    return {
      condition: 'fog_lifting',
      sherpaLine: 'The fog is lifting. Good to see you on the trail again.',
      fog: 0.4,
      clearSky: false,
      snowOnPeaks: false,
      warmLight: true,
      intensity: 0.5,
    }
  }

  // 7+ day gap - deep fog
  if (daysSinceActivity >= 7) {
    return {
      condition: 'deep_fog',
      sherpaLine: 'The trail is hard to see. But the mountain has not moved.',
      fog: 0.9,
      clearSky: false,
      snowOnPeaks: false,
      warmLight: false,
      intensity: 0.1,
    }
  }

  // 3-6 day gap - clouds building
  if (daysSinceActivity >= 3) {
    return {
      condition: 'clouds_building',
      sherpaLine: 'Clouds building on the ridge. A good day to climb before the weather turns.',
      fog: 0.5,
      clearSky: false,
      snowOnPeaks: false,
      warmLight: false,
      intensity: 0.3,
    }
  }

  // Moderate activity (1-4 sections this week, recent activity)
  if (weekSections >= 1) {
    return {
      condition: 'clear',
      sherpaLine: 'Clear skies. The trail is open.',
      fog: 0.1,
      clearSky: true,
      snowOnPeaks: false,
      warmLight: false,
      intensity: 0.6,
    }
  }

  // Default - calm conditions
  return {
    condition: 'calm',
    sherpaLine: 'Quiet on the mountain today. The trail is patient.',
    fog: 0.2,
    clearSky: true,
    snowOnPeaks: false,
    warmLight: false,
    intensity: 0.4,
  }
}

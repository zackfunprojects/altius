import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useExpeditionEvents(trekId) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user) {
      setEvents([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    let query = supabase
      .from('expedition_events')
      .select('*')
      .eq('user_id', user.id)
      .order('fired_at', { ascending: false })

    if (trekId) {
      query = query.eq('trek_id', trekId)
    }

    const { data, error: fetchError } = await query
    if (fetchError) setError(fetchError)
    else setEvents(data || [])
    setLoading(false)
  }, [user, trekId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const fireEvent = useCallback(
    async ({ eventType, title, body, elevationBonus = 0, metadata, eventTrekId }) => {
      if (!user) return

      const effectiveTrekId = eventTrekId || trekId || null

      const { data, error: insertError } = await supabase
        .from('expedition_events')
        .insert({
          user_id: user.id,
          trek_id: effectiveTrekId,
          event_type: eventType,
          title,
          body: body || null,
          elevation_bonus: elevationBonus,
          metadata: metadata || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Only add to local cache if it matches the current filter
      if (!trekId || effectiveTrekId === trekId) {
        setEvents((prev) => [data, ...prev])
      }

      return data
    },
    [user, trekId]
  )

  return { events, loading, error, fireEvent, refetch: fetch }
}

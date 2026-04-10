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
      setLoading(false)
      return
    }
    setLoading(true)

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

      const { data, error: insertError } = await supabase
        .from('expedition_events')
        .insert({
          user_id: user.id,
          trek_id: eventTrekId || trekId || null,
          event_type: eventType,
          title,
          body: body || null,
          elevation_bonus: elevationBonus,
          metadata: metadata || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setEvents((prev) => [data, ...prev])
      return data
    },
    [user, trekId]
  )

  return { events, loading, error, fireEvent, refetch: fetch }
}

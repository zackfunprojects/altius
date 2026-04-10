import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getExpeditionDay } from '../lib/expedition'

export function useTrekJournal(trekId) {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)

    let query = supabase
      .from('trek_journal')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (trekId) {
      query = query.eq('trek_id', trekId)
    }

    const { data, error: fetchError } = await query
    if (fetchError) setError(fetchError)
    else setEntries(data || [])
    setLoading(false)
  }, [user, trekId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const addNote = useCallback(
    async ({ body, sectionId, campId, isCampReflection = false }) => {
      if (!user || !trekId) return

      // Get profile for expedition day
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single()

      const expeditionDay = profile ? getExpeditionDay(profile.created_at) : 1

      const { data, error: insertError } = await supabase
        .from('trek_journal')
        .insert({
          trek_id: trekId,
          user_id: user.id,
          section_id: sectionId || null,
          camp_id: campId || null,
          body,
          is_camp_reflection: isCampReflection,
          expedition_day: expeditionDay,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setEntries((prev) => [data, ...prev])
      return data
    },
    [user, trekId]
  )

  return { entries, loading, error, addNote, refetch: fetch }
}

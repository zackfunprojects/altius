import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCurrentSection() {
  const { user } = useAuth()
  const [section, setSection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user) {
      setSection(null)
      setLoading(false)
      return
    }
    setLoading(true)

    // Find the active trek
    const { data: trek } = await supabase
      .from('treks')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!trek) {
      setSection(null)
      setLoading(false)
      return
    }

    // Find the first active section in that trek
    const { data, error: fetchError } = await supabase
      .from('trail_sections')
      .select('*')
      .eq('trek_id', trek.id)
      .eq('status', 'active')
      .order('section_number')
      .limit(1)
      .maybeSingle()

    if (fetchError) setError(fetchError)
    else setSection(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { section, loading, error, refetch: fetch }
}

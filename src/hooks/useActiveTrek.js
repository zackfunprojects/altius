import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useActiveTrek() {
  const { user } = useAuth()
  const [trek, setTrek] = useState(null)
  const [camps, setCamps] = useState([])
  const [currentSection, setCurrentSection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)

    // Fetch the active trek
    const { data: trekData, error: trekError } = await supabase
      .from('treks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (trekError) {
      setError(trekError)
      setLoading(false)
      return
    }

    if (!trekData) {
      setTrek(null)
      setCamps([])
      setCurrentSection(null)
      setLoading(false)
      return
    }

    setTrek(trekData)

    // Fetch camps for this trek
    const { data: campData } = await supabase
      .from('camps')
      .select('*')
      .eq('trek_id', trekData.id)
      .order('camp_number')

    setCamps(campData || [])

    // Find the current section (first active/unlocked section)
    const { data: sectionData } = await supabase
      .from('trail_sections')
      .select('*')
      .eq('trek_id', trekData.id)
      .eq('status', 'active')
      .order('section_number')
      .limit(1)
      .maybeSingle()

    setCurrentSection(sectionData)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()

    // Subscribe to trek changes
    if (!user) return

    const channel = supabase
      .channel(`active-trek:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'treks', filter: `user_id=eq.${user.id}` },
        () => fetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trail_sections' },
        () => fetch()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetch, user])

  const refetch = useCallback(() => fetch(), [fetch])

  return { trek, camps, currentSection, loading, error, refetch }
}

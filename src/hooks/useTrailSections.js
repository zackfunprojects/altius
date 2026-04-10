import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTrailSections(campId) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!campId) {
      setSections([])
      setLoading(false)
      return
    }
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('trail_sections')
      .select('*')
      .eq('camp_id', campId)
      .order('section_number')

    if (fetchError) setError(fetchError)
    else setSections(data || [])
    setLoading(false)
  }, [campId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { sections, loading, error, refetch: fetch }
}

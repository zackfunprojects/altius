import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCamps(trekId) {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!trekId) {
      setCamps([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('camps')
      .select('*')
      .eq('trek_id', trekId)
      .order('camp_number')

    if (fetchError) setError(fetchError)
    else setCamps(data || [])
    setLoading(false)
  }, [trekId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { camps, loading, error, refetch: fetch }
}

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useExerciseResponses(sectionId) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!sectionId) {
      setResponses([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('section_id', sectionId)
      .order('attempt_number')

    if (fetchError) setError(fetchError)
    else setResponses(data || [])
    setLoading(false)
  }, [sectionId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { responses, loading, error, refetch: fetch }
}

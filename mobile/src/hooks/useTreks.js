import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTreks(status) {
  const { user } = useAuth()
  const [treks, setTreks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!user) {
      setTreks([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    let query = supabase
      .from('treks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error: fetchError } = await query
    if (fetchError) setError(fetchError)
    else setTreks(data || [])
    setLoading(false)
  }, [user, status])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { treks, loading, error, refetch: fetch }
}

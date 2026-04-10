import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTrekNotebook() {
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

    const { data, error: fetchError } = await supabase
      .from('trek_notebook')
      .select('*')
      .eq('user_id', user.id)
      .order('summit_date', { ascending: false })

    if (fetchError) setError(fetchError)
    else setEntries(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { entries, loading, error, refetch: fetch }
}

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let channel

    async function fetch() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) setError(fetchError)
      else setProfile(data)
      setLoading(false)
    }

    fetch()

    // Real-time subscription for profile changes (elevation updates, etc.)
    channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => setProfile(payload.new)
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [user])

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setProfile(data)
      return data
    },
    [user]
  )

  return { profile, loading, error, updateProfile }
}

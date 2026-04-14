import { Linking } from 'react-native'
import { supabase } from './supabase'

/**
 * Creates a Stripe Checkout session and opens it in the system browser.
 * Mobile version - no window.location available.
 */
export async function createCheckoutSession() {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { origin: 'https://altius.vercel.app' },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  if (data.checkout_url) {
    await Linking.openURL(data.checkout_url)
  }

  return data.checkout_url
}

/**
 * Returns a human-readable subscription status.
 */
export function getSubscriptionStatus(profile) {
  if (!profile) return { tier: 'free', label: 'Free', active: false }

  if (profile.subscription_tier === 'pro') {
    return { tier: 'pro', label: 'Pro', active: true }
  }

  return { tier: 'free', label: 'Free', active: false }
}

/**
 * Centralized Pro feature gate check.
 */
export function isProFeature(feature) {
  const PRO_FEATURES = [
    'over_the_shoulder',
    'skill_refresh',
    'unlimited_treks',
    'all_difficulties',
    'unlimited_notebook',
  ]
  return PRO_FEATURES.includes(feature)
}

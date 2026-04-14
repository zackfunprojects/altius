import { supabase } from './supabase'

/**
 * Creates a Stripe Checkout session for Pro subscription.
 * Returns the checkout URL to redirect to.
 */
export async function createCheckoutSession(origin) {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { origin: origin || window.location.origin },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

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

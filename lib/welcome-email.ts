import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email-welcome'

type EnsureWelcomeEmailInput = {
  profileId: string
  email?: string | null
  fullName?: string | null
}

export async function ensureWelcomeEmailSent({
  profileId,
  email,
  fullName,
}: EnsureWelcomeEmailInput) {
  if (!profileId || !email) {
    return {
      ok: false,
      reason: 'missing_profile_or_email',
    }
  }

  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, email, full_name, welcome_email_sent_at')
    .eq('id', profileId)
    .maybeSingle()

  if (profileError || !profile) {
    return {
      ok: false,
      reason: 'profile_not_found',
      error: profileError?.message,
    }
  }

  if (profile.welcome_email_sent_at) {
    return {
      ok: true,
      reason: 'already_sent',
    }
  }

  const claimedAt = new Date().toISOString()

  const { data: claimedProfile, error: claimError } = await admin
    .from('profiles')
    .update({
      welcome_email_sent_at: claimedAt,
    })
    .eq('id', profileId)
    .is('welcome_email_sent_at', null)
    .select('id, email, full_name, welcome_email_sent_at')
    .maybeSingle()

  if (claimError) {
    return {
      ok: false,
      reason: 'claim_failed',
      error: claimError.message,
    }
  }

  if (!claimedProfile) {
    return {
      ok: true,
      reason: 'already_claimed_or_sent',
    }
  }

  const targetEmail = claimedProfile.email || profile.email || email
  const targetName = claimedProfile.full_name || profile.full_name || fullName

  try {
    await sendWelcomeEmail({
      to: targetEmail,
      fullName: targetName,
    })

    return {
      ok: true,
      reason: 'sent',
    }
  } catch (error) {
    console.error('Welcome email error:', error)

    await admin
      .from('profiles')
      .update({
        welcome_email_sent_at: null,
      })
      .eq('id', profileId)
      .eq('welcome_email_sent_at', claimedAt)

    return {
      ok: false,
      reason: 'send_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    }
  }
}
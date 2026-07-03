import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireRamxAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const email = user.email?.trim().toLowerCase() || ''
  const allowedEmails = getAllowedAdminEmails()

  if (allowedEmails.length === 0) {
    console.warn(
      'RAMX_ADMIN_EMAILS no está configurado. El panel admin está bloqueado.'
    )
    redirect('/dashboard')
  }

  if (!email || !allowedEmails.includes(email)) {
    redirect('/dashboard')
  }

  return {
    user,
    email,
  }
}

function getAllowedAdminEmails() {
  const raw = process.env.RAMX_ADMIN_EMAILS || ''

  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

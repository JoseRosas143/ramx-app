import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMedicalReminderEmail } from '@/lib/email-reminders'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.RAMX_CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: reminders, error } = await supabase
    .from('pet_reminders')
    .select('*')
    .eq('status', 'pending')
    .lte('reminder_date', today)
    .order('reminder_date', { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processed = 0
  let emailSent = 0
  let emailFailed = 0

  for (const reminder of reminders || []) {
    const { data: pet } = await supabase
      .from('pets')
      .select('id, name')
      .eq('id', reminder.pet_id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', reminder.recipient_profile_id)
      .single()

    const actionUrl = `/dashboard/pets/${reminder.pet_id}/medical`
    const fullActionUrl = `${siteUrl}${actionUrl}`

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
.insert({
  recipient_profile_id: reminder.recipient_profile_id,
  channel: 'in_app',
  title: reminder.title,
  body: reminder.body,
  action_url: actionUrl,
  pet_id: reminder.pet_id,
  kind: 'medical_reminder',
        meta: {
          reminder_id: reminder.id,
          reminder_kind: reminder.reminder_kind,
          due_date: reminder.due_date,
          source_table: reminder.source_table,
          source_id: reminder.source_id,
        },
      })
      .select('id')
      .single()

    if (notificationError) {
      await supabase
        .from('pet_reminders')
        .update({
          status: 'failed',
          meta: {
            ...(reminder.meta || {}),
            notification_error: notificationError.message,
          },
        })
        .eq('id', reminder.id)

      continue
    }

    let emailError: string | null = null

    if (profile?.email) {
      try {
        await sendMedicalReminderEmail({
          to: profile.email,
          petName: pet?.name || 'tu mascota',
          title: reminder.title,
          body: reminder.body,
          dueDate: formatDate(reminder.due_date),
          actionUrl: fullActionUrl,
        })

        emailSent += 1
      } catch (err) {
        emailFailed += 1
        emailError = err instanceof Error ? err.message : 'Error desconocido al enviar email'
      }
    }

    await supabase
      .from('pet_reminders')
      .update({
        status: 'sent',
        notification_sent_at: new Date().toISOString(),
        email_sent_at: emailError ? null : new Date().toISOString(),
        meta: {
          ...(reminder.meta || {}),
          notification_id: notification?.id || null,
          email_error: emailError,
        },
      })
      .eq('id', reminder.id)

    processed += 1
  }

  return NextResponse.json({
    ok: true,
    date: today,
    processed,
    emailSent,
    emailFailed,
  })
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
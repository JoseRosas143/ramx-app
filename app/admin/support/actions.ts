'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPPORT_STATUSES = [
  'new',
  'open',
  'customer_replied',
  'waiting_customer',
  'in_progress',
  'resolved',
  'closed',
] as const

const SUPPORT_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export async function updateRamxSupportTicketAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const statusRaw = String(formData.get('status') || '')
  const priorityRaw = String(formData.get('priority') || '')
  const assignedTo = clean(formData.get('assigned_to'))
  const internalNote = clean(formData.get('internal_note'))
  const returnTo = safeReturnTo(formData.get('return_to'))

  if (!ticketId) throw new Error('No se recibió el ticket.')
  if (!SUPPORT_STATUSES.includes(statusRaw as (typeof SUPPORT_STATUSES)[number])) throw new Error('Estatus inválido.')
  if (!SUPPORT_PRIORITIES.includes(priorityRaw as (typeof SUPPORT_PRIORITIES)[number])) throw new Error('Prioridad inválida.')

  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    status: statusRaw,
    priority: priorityRaw,
    assigned_to: assignedTo,
    updated_at: now,
  }

  if (statusRaw === 'resolved') payload.resolved_at = now
  if (statusRaw === 'closed') payload.closed_at = now

  const { error } = await admin
    .from('ramx_support_tickets')
    .update(payload)
    .eq('id', ticketId)

  if (error) throw new Error(`No se pudo actualizar el ticket: ${error.message}`)

  if (internalNote) {
    await admin.from('ramx_support_messages').insert({
      ticket_id: ticketId,
      sender_type: 'admin',
      author_name: 'Equipo RAMX',
      author_email: null,
      body: internalNote,
      is_internal: true,
      created_at: now,
    })
  }

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, 'saved'))
}

export async function addAdminRamxSupportReplyAction(formData: FormData) {
  const { email } = await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const body = clean(formData.get('reply_body'))
  const returnTo = safeReturnTo(formData.get('return_to'))

  if (!ticketId || !body) throw new Error('Escribe una respuesta para el cliente.')

  const now = new Date().toISOString()
  const { error } = await admin.from('ramx_support_messages').insert({
    ticket_id: ticketId,
    sender_type: 'admin',
    author_name: 'Equipo RAMX',
    author_email: email,
    body,
    is_internal: false,
    created_at: now,
  })

  if (error) throw new Error(`No se pudo responder el ticket: ${error.message}`)

  await admin
    .from('ramx_support_tickets')
    .update({
      status: 'waiting_customer',
      last_message_at: now,
      updated_at: now,
    })
    .eq('id', ticketId)

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, 'replied'))
}

export async function archiveRamxSupportTicketAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const returnTo = safeReturnTo(formData.get('return_to'))

  if (!ticketId) throw new Error('No se recibió el ticket.')

  const { error } = await admin
    .from('ramx_support_tickets')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) throw new Error(`No se pudo archivar el ticket: ${error.message}`)

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, 'archived'))
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text.slice(0, 4000) : null
}

function safeReturnTo(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  if (!text.startsWith('/admin/support')) return '/admin/support'
  return text.slice(0, 500)
}

function withNotice(path: string, notice: string) {
  const url = new URL(path, 'https://ramx.local')
  url.searchParams.set('notice', notice)
  return `${url.pathname}${url.search}`
}

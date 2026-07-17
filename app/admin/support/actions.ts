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

type SupportStatus = (typeof SUPPORT_STATUSES)[number]
type SupportPriority = (typeof SUPPORT_PRIORITIES)[number]

export async function updateRamxSupportTicketAction(formData: FormData) {
  const { email } = await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const statusRaw = String(formData.get('status') || '')
  const priorityRaw = String(formData.get('priority') || '')
  const assignedTo = clean(formData.get('assigned_to'))
  const internalNote = clean(formData.get('internal_note'))
  const adminSummary = clean(formData.get('admin_summary'))
  const tags = parseTags(formData.get('tags'))
  const resolutionSummary = clean(formData.get('resolution_summary'))
  const returnTo = safeReturnTo(formData.get('return_to'))

  if (!ticketId) throw new Error('No se recibió el ticket.')
  if (!SUPPORT_STATUSES.includes(statusRaw as SupportStatus)) throw new Error('Estatus inválido.')
  if (!SUPPORT_PRIORITIES.includes(priorityRaw as SupportPriority)) throw new Error('Prioridad inválida.')

  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    status: statusRaw,
    priority: priorityRaw,
    assigned_to: assignedTo,
    admin_summary: adminSummary,
    tags,
    resolution_summary: resolutionSummary,
    updated_at: now,
    status_changed_at: now,
  }

  if (statusRaw === 'resolved') payload.resolved_at = now
  if (statusRaw === 'closed') payload.closed_at = now
  if (statusRaw !== 'resolved') payload.resolved_at = null
  if (statusRaw !== 'closed') payload.closed_at = null

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
      author_email: email,
      body: internalNote,
      is_internal: true,
      created_at: now,
    })
  }

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, 'saved'))
}

export async function moveRamxSupportTicketAction(formData: FormData) {
  const { email } = await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const nextStatusRaw = String(formData.get('next_status') || '')
  const returnTo = safeReturnTo(formData.get('return_to'))
  const quickNote = clean(formData.get('quick_note'))

  if (!ticketId) throw new Error('No se recibió el ticket.')
  if (!SUPPORT_STATUSES.includes(nextStatusRaw as SupportStatus)) throw new Error('Estatus inválido.')

  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    status: nextStatusRaw,
    updated_at: now,
    status_changed_at: now,
  }

  if (nextStatusRaw === 'resolved') payload.resolved_at = now
  if (nextStatusRaw === 'closed') payload.closed_at = now
  if (nextStatusRaw !== 'resolved') payload.resolved_at = null
  if (nextStatusRaw !== 'closed') payload.closed_at = null

  const { error } = await admin
    .from('ramx_support_tickets')
    .update(payload)
    .eq('id', ticketId)

  if (error) throw new Error(`No se pudo mover el ticket: ${error.message}`)

  if (quickNote) {
    await admin.from('ramx_support_messages').insert({
      ticket_id: ticketId,
      sender_type: 'admin',
      author_name: 'Equipo RAMX',
      author_email: email,
      body: quickNote,
      is_internal: true,
      created_at: now,
    })
  }

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, 'moved'))
}

export async function addAdminRamxSupportReplyAction(formData: FormData) {
  const { email } = await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const body = clean(formData.get('reply_body'))
  const returnTo = safeReturnTo(formData.get('return_to'))
  const closeAfterReply = String(formData.get('close_after_reply') || '') === 'on'

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

  const { data: ticket } = await admin
    .from('ramx_support_tickets')
    .select('first_response_at')
    .eq('id', ticketId)
    .maybeSingle()

  const updatePayload: Record<string, unknown> = {
    status: closeAfterReply ? 'resolved' : 'waiting_customer',
    last_message_at: now,
    last_admin_message_at: now,
    updated_at: now,
    status_changed_at: now,
  }

  if (!ticket?.first_response_at) updatePayload.first_response_at = now
  if (closeAfterReply) updatePayload.resolved_at = now

  await admin
    .from('ramx_support_tickets')
    .update(updatePayload)
    .eq('id', ticketId)

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, closeAfterReply ? 'resolved' : 'replied'))
}

export async function addAdminRamxInternalNoteAction(formData: FormData) {
  const { email } = await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const body = clean(formData.get('internal_note'))
  const returnTo = safeReturnTo(formData.get('return_to'))

  if (!ticketId || !body) throw new Error('Escribe una nota interna.')

  const now = new Date().toISOString()
  const { error } = await admin.from('ramx_support_messages').insert({
    ticket_id: ticketId,
    sender_type: 'admin',
    author_name: 'Equipo RAMX',
    author_email: email,
    body,
    is_internal: true,
    created_at: now,
  })

  if (error) throw new Error(`No se pudo guardar la nota: ${error.message}`)

  await admin
    .from('ramx_support_tickets')
    .update({ updated_at: now })
    .eq('id', ticketId)

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, 'note'))
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

export async function restoreRamxSupportTicketAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const ticketId = String(formData.get('ticket_id') || '')
  const returnTo = safeReturnTo(formData.get('return_to'))

  if (!ticketId) throw new Error('No se recibió el ticket.')

  const { error } = await admin
    .from('ramx_support_tickets')
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) throw new Error(`No se pudo restaurar el ticket: ${error.message}`)

  revalidatePath('/admin/support')
  redirect(withNotice(returnTo, 'restored'))
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text.slice(0, 6000) : null
}

function parseTags(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  if (!text) return []
  return text
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12)
}

function safeReturnTo(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  if (!text.startsWith('/admin/support')) return '/admin/support'
  return text.slice(0, 700)
}

function withNotice(path: string, notice: string) {
  const url = new URL(path, 'https://ramx.local')
  url.searchParams.set('notice', notice)
  return `${url.pathname}${url.search}`
}

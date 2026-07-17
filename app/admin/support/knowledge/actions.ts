'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRamxAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function saveRamxKnowledgeArticleAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()

  const articleId = clean(formData.get('article_id'))
  const title = clean(formData.get('title'))
  const category = clean(formData.get('category')) || 'soporte'
  const keywords = parseKeywords(formData.get('keywords'))
  const content = cleanLong(formData.get('content'))
  const sortOrder = Number(formData.get('sort_order') || 100)
  const isActive = String(formData.get('is_active') || '') === 'on'

  if (!title || !content) {
    redirect('/admin/support/knowledge?notice=missing')
  }

  const payload = {
    title,
    slug: slugify(title),
    category,
    keywords,
    content,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }

  const result = articleId
    ? await admin.from('ramx_support_knowledge_articles').update(payload).eq('id', articleId)
    : await admin.from('ramx_support_knowledge_articles').insert(payload)

  if (result.error) {
    throw new Error(`No se pudo guardar el artículo: ${result.error.message}`)
  }

  revalidatePath('/admin/support/knowledge')
  redirect('/admin/support/knowledge?notice=saved')
}

export async function toggleRamxKnowledgeArticleAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()
  const articleId = clean(formData.get('article_id'))
  const nextActive = String(formData.get('next_active') || '') === 'true'

  if (!articleId) throw new Error('No se recibió el artículo.')

  const { error } = await admin
    .from('ramx_support_knowledge_articles')
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq('id', articleId)

  if (error) throw new Error(`No se pudo actualizar el artículo: ${error.message}`)

  revalidatePath('/admin/support/knowledge')
  redirect('/admin/support/knowledge?notice=updated')
}

export async function deleteRamxKnowledgeArticleAction(formData: FormData) {
  await requireRamxAdmin()
  const admin = createAdminClient()
  const articleId = clean(formData.get('article_id'))

  if (!articleId) throw new Error('No se recibió el artículo.')

  const { error } = await admin
    .from('ramx_support_knowledge_articles')
    .delete()
    .eq('id', articleId)

  if (error) throw new Error(`No se pudo eliminar el artículo: ${error.message}`)

  revalidatePath('/admin/support/knowledge')
  redirect('/admin/support/knowledge?notice=deleted')
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > 0 ? text.slice(0, 240) : null
}

function cleanLong(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length > 0 ? text.slice(0, 8000) : null
}

function parseKeywords(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 24)
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

  return base || `ramx-${Date.now()}`
}

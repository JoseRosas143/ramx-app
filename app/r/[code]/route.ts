import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteContext = {
  params: Promise<{
    code: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { code } = await params
  const normalizedCode = normalizeCode(code)
  const admin = createAdminClient()

  const { data: physicalCode, error } = await admin
    .from('ramx_physical_codes')
    .select(
      `
      id,
      code,
      status,
      assigned_pet_id,
      assigned_profile_id
    `
    )
    .eq('code', normalizedCode)
    .maybeSingle()

  if (error || !physicalCode) {
    return NextResponse.redirect(
      new URL(`/activate/${encodeURIComponent(normalizedCode)}?status=invalid`, request.url)
    )
  }

  await admin.from('ramx_product_scan_events').insert({
    code_id: physicalCode.id,
    code: physicalCode.code,
    pet_id: physicalCode.assigned_pet_id,
    profile_id: physicalCode.assigned_profile_id,
    source: 'redirect',
    user_agent: request.headers.get('user-agent'),
    referrer: request.headers.get('referer'),
  })

  if (physicalCode.status === 'disabled') {
    return NextResponse.redirect(
      new URL(`/activate/${encodeURIComponent(normalizedCode)}?status=disabled`, request.url)
    )
  }

  if (physicalCode.status === 'activated' && physicalCode.assigned_pet_id) {
    const { data: pet } = await admin
      .from('pets')
      .select('id, public_slug')
      .eq('id', physicalCode.assigned_pet_id)
      .maybeSingle()

    if (pet?.public_slug) {
      return NextResponse.redirect(new URL(`/p/${pet.public_slug}`, request.url))
    }
  }

  return NextResponse.redirect(
    new URL(`/activate/${encodeURIComponent(normalizedCode)}`, request.url)
  )
}

function normalizeCode(value: string) {
  return decodeURIComponent(value || '')
    .trim()
    .toUpperCase()
}

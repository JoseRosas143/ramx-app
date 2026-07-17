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
  const supabase = createAdminClient()

  if (!normalizedCode) {
    return NextResponse.redirect(
      new URL('/activate/invalid?status=invalid', request.url)
    )
  }

  const { data: physicalCode, error } = await supabase
    .from('ramx_physical_codes')
    .select(
      `
      id,
      code,
      status,
      assigned_order_id,
      assigned_pet_id,
      deleted_at
    `
    )
    .eq('code', normalizedCode)
    .maybeSingle()

  if (error || !physicalCode || physicalCode.deleted_at) {
    return NextResponse.redirect(
      new URL(
        `/activate/${encodeURIComponent(normalizedCode)}?status=invalid`,
        request.url
      )
    )
  }

  if (physicalCode.status === 'disabled' || physicalCode.status === 'blocked' || physicalCode.status === 'replaced') {
    return NextResponse.redirect(
      new URL(
        `/activate/${encodeURIComponent(normalizedCode)}?status=disabled`,
        request.url
      )
    )
  }

  if (physicalCode.status !== 'activated' || !physicalCode.assigned_pet_id) {
    await supabase.from('ramx_product_scan_events').insert({
      code_id: physicalCode.id,
      code: physicalCode.code,
      source: physicalCode.status === 'assigned' ? 'redirect_assigned_unactivated' : 'redirect_unactivated',
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.redirect(
      new URL(`/activate/${encodeURIComponent(normalizedCode)}`, request.url)
    )
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id, public_slug')
    .eq('id', physicalCode.assigned_pet_id)
    .maybeSingle()

  if (!pet?.public_slug) {
    return NextResponse.redirect(
      new URL(
        `/activate/${encodeURIComponent(normalizedCode)}?status=pet_not_found`,
        request.url
      )
    )
  }

  await supabase.from('ramx_product_scan_events').insert({
    code_id: physicalCode.id,
    code: physicalCode.code,
    pet_id: pet.id,
    source: 'redirect_public_profile',
  })

  return NextResponse.redirect(new URL(`/p/${pet.public_slug}`, request.url))
}

function normalizeCode(value: string) {
  return decodeURIComponent(value || '')
    .trim()
    .toUpperCase()
}
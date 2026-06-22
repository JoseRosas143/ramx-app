import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type PetSearchResult = {
  id: string
  public_slug: string | null
  microchip_number: string | null
  internal_id: string | null
  status: string | null
}

const PET_SELECT = `
  id,
  public_slug,
  microchip_number,
  internal_id,
  status
`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q')

  const candidates = buildSearchCandidates(rawQuery)

  if (candidates.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Escribe un microchip, ID RAMX o enlace de perfil.',
      },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const [microchipMatches, internalIdMatches, slugMatches] = await Promise.all([
    findPetsByField(admin, 'microchip_number', candidates),
    findPetsByField(admin, 'internal_id', candidates),
    findPetsByField(admin, 'public_slug', candidates),
  ])

  const bestMatch =
    microchipMatches[0] || internalIdMatches[0] || slugMatches[0] || null

  if (!bestMatch) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'No encontramos una mascota con ese microchip, ID RAMX o enlace público.',
      },
      { status: 404 }
    )
  }

  const canonicalSlug =
    bestMatch.public_slug ||
    bestMatch.microchip_number ||
    bestMatch.internal_id ||
    bestMatch.id

  return NextResponse.json({
    ok: true,
    redirectUrl: `/p/${encodeURIComponent(canonicalSlug)}`,
    matchedBy: getMatchedBy(bestMatch, candidates),
  })
}

async function findPetsByField(
  admin: ReturnType<typeof createAdminClient>,
  field: 'microchip_number' | 'internal_id' | 'public_slug',
  candidates: string[]
) {
  const { data, error } = await admin
    .from('pets')
    .select(PET_SELECT)
    .in(field, candidates)
    .limit(5)

  if (error) {
    console.error(`RAMX pet search error by ${field}:`, error.message)
    return []
  }

  return (data || []) as PetSearchResult[]
}

function getMatchedBy(pet: PetSearchResult, candidates: string[]) {
  if (pet.microchip_number && candidates.includes(pet.microchip_number)) {
    return 'microchip'
  }

  if (pet.internal_id && candidates.includes(pet.internal_id)) {
    return 'internal_id'
  }

  if (pet.public_slug && candidates.includes(pet.public_slug)) {
    return 'public_slug'
  }

  return 'unknown'
}

function buildSearchCandidates(value: string | null) {
  if (!value) return []

  let cleanValue = value.trim()

  if (!cleanValue) return []

  cleanValue = removeInvisibleCharacters(cleanValue)

  const extractedFromUrl = extractPublicSlugFromUrl(cleanValue)
  const base = extractedFromUrl || cleanValue

  const candidates = new Set<string>()

  addCandidate(candidates, base)
  addCandidate(candidates, base.toLowerCase())
  addCandidate(candidates, base.toUpperCase())
  addCandidate(candidates, base.replace(/\s+/g, ''))
  addCandidate(candidates, base.replace(/\s+/g, '-').toUpperCase())

  const digitsOnly = base.replace(/\D/g, '')
  if (digitsOnly.length >= 6) {
    addCandidate(candidates, digitsOnly)
  }

  const compactUpper = base.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (compactUpper.startsWith('PET') && compactUpper.length > 3) {
    addCandidate(candidates, `PET-${compactUpper.slice(3)}`)
  }

  return Array.from(candidates).slice(0, 20)
}

function addCandidate(candidates: Set<string>, value: string) {
  const candidate = value.trim()

  if (candidate.length > 0 && candidate.length <= 120) {
    candidates.add(candidate)
  }
}

function extractPublicSlugFromUrl(value: string) {
  try {
    const url = new URL(value)
    const parts = url.pathname.split('/').filter(Boolean)
    const profileIndex = parts.findIndex((part) => part === 'p')

    if (profileIndex >= 0 && parts[profileIndex + 1]) {
      return decodeURIComponent(parts[profileIndex + 1])
    }

    return null
  } catch {
    return null
  }
}

function removeInvisibleCharacters(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '')
}
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 2592000

type InegiGeoItem = {
  cvegeo?: string
  cve_ent?: string
  cve_mun?: string
  nomgeo?: string
  nom_abrev?: string
}

type InegiResponse = {
  datos?: InegiGeoItem[]
  numReg?: number
}

const INEGI_BASE_URL = 'https://gaia.inegi.org.mx/wscatgeo/v2'
const ONE_MONTH_IN_SECONDS = 2592000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stateCode = searchParams.get('stateCode')

  try {
    if (stateCode) {
      if (!/^\d{2}$/.test(stateCode)) {
        return NextResponse.json(
          {
            ok: false,
            message: 'Clave de estado inválida.',
            items: [],
          },
          { status: 400 }
        )
      }

      const data = await fetchInegi(`${INEGI_BASE_URL}/mgem/${stateCode}`)

      const items = (data.datos || [])
        .map((item) => ({
          code: item.cve_mun || '',
          stateCode: item.cve_ent || stateCode,
          fullCode: item.cvegeo || `${stateCode}${item.cve_mun || ''}`,
          name: item.nomgeo || '',
        }))
        .filter((item) => item.code && item.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'es-MX'))

      return NextResponse.json({
        ok: true,
        type: 'municipalities',
        stateCode,
        items,
      })
    }

    const data = await fetchInegi(`${INEGI_BASE_URL}/mgee/`)

    const items = (data.datos || [])
      .map((item) => ({
        code: item.cve_ent || item.cvegeo || '',
        fullCode: item.cvegeo || item.cve_ent || '',
        name: item.nomgeo || '',
        abbreviation: item.nom_abrev || null,
      }))
      .filter((item) => item.code && item.name)
      .sort((a, b) => a.name.localeCompare(b.name, 'es-MX'))

    return NextResponse.json({
      ok: true,
      type: 'states',
      items,
    })
  } catch (error) {
    console.error('RAMX geo API error:', error)

    return NextResponse.json(
      {
        ok: false,
        message: 'No se pudo cargar el catálogo geográfico.',
        items: [],
      },
      { status: 502 }
    )
  }
}

async function fetchInegi(url: string): Promise<InegiResponse> {
  const response = await fetch(url, {
    next: {
      revalidate: ONE_MONTH_IN_SECONDS,
    },
  })

  if (!response.ok) {
    throw new Error(`INEGI respondió ${response.status}`)
  }

  return response.json()
}
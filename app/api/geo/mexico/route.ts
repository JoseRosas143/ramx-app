import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

type StateOption = {
  code: string
  fullCode: string
  name: string
  abbreviation: string | null
}

const INEGI_BASE_URL = 'https://gaia.inegi.org.mx/wscatgeo/v2'
const FALLBACK_STATES: StateOption[] = [
  { code: '01', fullCode: '01', name: 'Aguascalientes', abbreviation: 'Ags.' },
  { code: '02', fullCode: '02', name: 'Baja California', abbreviation: 'BC' },
  { code: '03', fullCode: '03', name: 'Baja California Sur', abbreviation: 'BCS' },
  { code: '04', fullCode: '04', name: 'Campeche', abbreviation: 'Camp.' },
  { code: '05', fullCode: '05', name: 'Coahuila de Zaragoza', abbreviation: 'Coah.' },
  { code: '06', fullCode: '06', name: 'Colima', abbreviation: 'Col.' },
  { code: '07', fullCode: '07', name: 'Chiapas', abbreviation: 'Chis.' },
  { code: '08', fullCode: '08', name: 'Chihuahua', abbreviation: 'Chih.' },
  { code: '09', fullCode: '09', name: 'Ciudad de México', abbreviation: 'CDMX' },
  { code: '10', fullCode: '10', name: 'Durango', abbreviation: 'Dgo.' },
  { code: '11', fullCode: '11', name: 'Guanajuato', abbreviation: 'Gto.' },
  { code: '12', fullCode: '12', name: 'Guerrero', abbreviation: 'Gro.' },
  { code: '13', fullCode: '13', name: 'Hidalgo', abbreviation: 'Hgo.' },
  { code: '14', fullCode: '14', name: 'Jalisco', abbreviation: 'Jal.' },
  { code: '15', fullCode: '15', name: 'México', abbreviation: 'Méx.' },
  { code: '16', fullCode: '16', name: 'Michoacán de Ocampo', abbreviation: 'Mich.' },
  { code: '17', fullCode: '17', name: 'Morelos', abbreviation: 'Mor.' },
  { code: '18', fullCode: '18', name: 'Nayarit', abbreviation: 'Nay.' },
  { code: '19', fullCode: '19', name: 'Nuevo León', abbreviation: 'NL' },
  { code: '20', fullCode: '20', name: 'Oaxaca', abbreviation: 'Oax.' },
  { code: '21', fullCode: '21', name: 'Puebla', abbreviation: 'Pue.' },
  { code: '22', fullCode: '22', name: 'Querétaro', abbreviation: 'Qro.' },
  { code: '23', fullCode: '23', name: 'Quintana Roo', abbreviation: 'Q. Roo' },
  { code: '24', fullCode: '24', name: 'San Luis Potosí', abbreviation: 'SLP' },
  { code: '25', fullCode: '25', name: 'Sinaloa', abbreviation: 'Sin.' },
  { code: '26', fullCode: '26', name: 'Sonora', abbreviation: 'Son.' },
  { code: '27', fullCode: '27', name: 'Tabasco', abbreviation: 'Tab.' },
  { code: '28', fullCode: '28', name: 'Tamaulipas', abbreviation: 'Tamps.' },
  { code: '29', fullCode: '29', name: 'Tlaxcala', abbreviation: 'Tlax.' },
  { code: '30', fullCode: '30', name: 'Veracruz de Ignacio de la Llave', abbreviation: 'Ver.' },
  { code: '31', fullCode: '31', name: 'Yucatán', abbreviation: 'Yuc.' },
  { code: '32', fullCode: '32', name: 'Zacatecas', abbreviation: 'Zac.' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stateCode = searchParams.get('stateCode')

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

    try {
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
        source: 'inegi',
      })
    } catch (error) {
      console.error('RAMX geo municipalities API error:', error)

      return NextResponse.json({
        ok: true,
        type: 'municipalities',
        stateCode,
        items: [],
        source: 'fallback-empty',
        message:
          'No se pudieron cargar los municipios en este momento. Intenta de nuevo en unos segundos.',
      })
    }
  }

  try {
    const data = await fetchInegi(`${INEGI_BASE_URL}/mgee/`)

    const items = (data.datos || [])
      .map((item) => ({
        code: padStateCode(item.cve_ent || item.cvegeo || ''),
        fullCode: padStateCode(item.cvegeo || item.cve_ent || ''),
        name: item.nomgeo || '',
        abbreviation: item.nom_abrev || null,
      }))
      .filter((item) => item.code && item.name)
      .sort((a, b) => a.name.localeCompare(b.name, 'es-MX'))

    return NextResponse.json({
      ok: true,
      type: 'states',
      items: items.length > 0 ? items : FALLBACK_STATES,
      source: items.length > 0 ? 'inegi' : 'fallback',
    })
  } catch (error) {
    console.error('RAMX geo states API error:', error)

    return NextResponse.json({
      ok: true,
      type: 'states',
      items: FALLBACK_STATES,
      source: 'fallback',
    })
  }
}

async function fetchInegi(url: string): Promise<InegiResponse> {
  const response = await fetch(url, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`INEGI respondió ${response.status}`)
  }

  return response.json()
}

function padStateCode(value: string) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.padStart(2, '0').slice(0, 2)
}

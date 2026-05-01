import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewSightingEmail } from '@/lib/email'

type Payload = {
  petId?: string
  petSlug?: string
  petName?: string
  reportType?: 'sighting' | 'found_safe'
  reporterName?: string
  reporterPhone?: string
  reporterWhatsapp?: string
  seenAt?: string
  locationText?: string
  notes?: string
  lat?: number | null
  lng?: number | null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload

    if (!body.petId || !body.reportType) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios del reporte.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    const { data: pet, error: petError } = await admin
      .from('pets')
      .select('id, name, public_slug, primary_tutor_profile_id')
      .eq('id', body.petId)
      .single()

    if (petError || !pet) {
      return NextResponse.json(
        { error: 'No se encontró la mascota.' },
        { status: 404 }
      )
    }

    const parsedLat =
      typeof body.lat === 'number' && !Number.isNaN(body.lat) ? body.lat : null
    const parsedLng =
      typeof body.lng === 'number' && !Number.isNaN(body.lng) ? body.lng : null

    const { data: sighting, error: sightingError } = await admin
      .from('sightings')
      .insert({
        pet_id: body.petId,
        report_type: body.reportType,
        reporter_name: body.reporterName || null,
        reporter_phone: body.reporterPhone || null,
        reporter_whatsapp: body.reporterWhatsapp || null,
        seen_at: body.seenAt
          ? new Date(body.seenAt).toISOString()
          : new Date().toISOString(),
        location_text: body.locationText || null,
        notes: body.notes || null,
        lat: parsedLat,
        lng: parsedLng,
        status: 'new',
      })
      .select('id, pet_id, report_type, seen_at, location_text, notes')
      .single()

    if (sightingError || !sighting) {
      return NextResponse.json(
        { error: sightingError?.message || 'No se pudo guardar el reporte.' },
        { status: 500 }
      )
    }

    const { data: tutorProfile } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', pet.primary_tutor_profile_id)
      .single()

    const title =
      body.reportType === 'found_safe'
        ? `Reportaron que tienen resguardada a ${pet.name}`
        : `Nuevo avistamiento de ${pet.name}`

    const bodyText =
      body.reportType === 'found_safe'
        ? `Se recibió un reporte donde indican que la mascota podría estar resguardada.`
        : `Se recibió un nuevo reporte público de avistamiento.`

    await admin.from('notifications').insert({
      recipient_profile_id: pet.primary_tutor_profile_id,
      pet_id: pet.id,
      sighting_id: sighting.id,
      channel: 'in_app',
      kind: body.reportType === 'found_safe' ? 'pet_found_safe' : 'new_sighting',
      title,
      body: bodyText,
      action_url: `/p/${pet.public_slug}`,
      meta: {
        petName: pet.name,
        publicSlug: pet.public_slug,
        reportType: body.reportType,
        locationText: body.locationText || null,
        seenAt: sighting.seen_at,
        hasGeo: parsedLat !== null && parsedLng !== null,
      },
    })

    if (tutorProfile?.email) {
      const publicProfileUrl = `${req.nextUrl.origin}/p/${pet.public_slug}`
    
      try {
        await sendNewSightingEmail({
          to: tutorProfile.email,
          tutorName: tutorProfile.full_name,
          petName: pet.name,
          reportType: body.reportType,
          locationText: body.locationText || null,
          seenAt: sighting.seen_at,
          reporterName: body.reporterName || null,
          reporterPhone: body.reporterPhone || null,
          reporterWhatsapp: body.reporterWhatsapp || null,
          notes: body.notes || null,
          publicProfileUrl,
        })
      } catch (emailError) {
        console.error('Error enviando correo:', emailError)
    
        await admin.from('notifications').insert({
          recipient_profile_id: pet.primary_tutor_profile_id,
          pet_id: pet.id,
          sighting_id: sighting.id,
          channel: 'email',
          kind: 'system',
          title: 'No se pudo enviar el correo automático',
          body: 'El reporte se guardó correctamente, pero el correo al tutor falló.',
          action_url: `/p/${pet.public_slug}`,
          meta: {
            petName: pet.name,
            publicSlug: pet.public_slug,
            reportType: body.reportType,
            intendedEmail: tutorProfile.email,
          },
        })
      }
    }

    return NextResponse.json({ ok: true, sightingId: sighting.id })
  } catch (error) {
    console.error('Error en /api/public-report:', error)
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar el reporte.' },
      { status: 500 }
    )
  }
}
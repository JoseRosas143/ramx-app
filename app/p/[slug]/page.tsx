import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { getPublicPetBySlug } from '@/lib/pets'
import PublicPetGallery from '@/components/public-pet-gallery'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function PublicPetPage({ params }: PageProps) {
  const { slug } = await params
  const pet = await getPublicPetBySlug(slug)

  if (!pet) {
    notFound()
  }

  const phone = pet.tutor_phone || pet.tutor_whatsapp_phone || ''
  const whatsappPhone = pet.tutor_whatsapp_phone || pet.tutor_phone || ''

  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=Hola,%20encontré%20información%20de%20tu%20mascota%20en%20RAMX`
    : null

  const ageText = getAgeText(pet.birth_date)

  const showContact =
    (pet.show_primary_tutor_phone && !!phone) ||
    (pet.show_whatsapp_button && !!whatsappUrl)

  const showVet =
    !!pet.vet_clinic_name ||
    !!pet.vet_phone ||
    !!pet.vet_state ||
    !!pet.vet_municipality

  const hasActiveLostReport =
    !!pet.active_lost_at ||
    !!pet.active_last_seen_text ||
    !!pet.active_reward_text ||
    !!pet.active_circumstances ||
    !!pet.active_public_contact_instructions

  const isLost = pet.status === 'lost' || hasActiveLostReport

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="text-center">
          <Badge className="rounded-full bg-white/80 px-4 py-1 text-neutral-700 shadow-sm hover:bg-white/80">
            RAMX · Perfil público
          </Badge>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-2xl backdrop-blur">
          <div className="space-y-6 p-4 sm:p-6">
            <PublicPetGallery
              photos={pet.photos || []}
              fallbackUrl={pet.profile_photo_url}
              petName={pet.name || 'Mascota'}
            />

            <div className="space-y-5 pt-6 text-center">
              <div className="flex flex-wrap justify-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm ${
                    isLost
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isLost ? 'Mascota extraviada' : 'Perfil activo'}
                </span>

                {ageText ? (
                  <span className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
                    {ageText}
                  </span>
                ) : null}

                {pet.sex ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-5 py-2.5 text-sm font-semibold text-amber-900 shadow-sm">
                    {pet.sex}
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                {pet.show_pet_name ? pet.name : 'Mascota registrada'}
              </h1>

              <p className="mx-auto max-w-xl text-sm leading-6 text-neutral-600">
                {isLost
                  ? 'Esta mascota está reportada como extraviada. Si tienes información, por favor contacta a su tutor.'
                  : 'Si encontraste a esta mascota, por favor contacta a su tutor. Tu ayuda puede hacer la diferencia para que vuelva a casa.'}
              </p>

              <div className="grid gap-3 text-left sm:grid-cols-2">
                {pet.show_species ? (
                  <MiniStat label="Especie" value={pet.species || 'No disponible'} />
                ) : null}

                {pet.show_breed ? (
                  <MiniStat label="Raza" value={pet.breed || 'No disponible'} />
                ) : null}

                <MiniStat label="Color" value={pet.color || 'No disponible'} />

                {pet.show_microchip ? (
                  <MiniStat
                    label="Microchip / ID"
                    value={pet.microchip_number || pet.internal_id || 'No disponible'}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {isLost ? (
          <section className="rounded-[28px] border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-red-900">
              Reporte de extravío
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {pet.active_lost_at ? (
                <LostInfoCard
                  label="Fecha del extravío"
                  value={formatDateTime(pet.active_lost_at)}
                />
              ) : null}

              {pet.active_last_seen_text ? (
                <LostInfoCard
                  label="Última ubicación conocida"
                  value={pet.active_last_seen_text}
                />
              ) : null}

              {pet.active_reward_text ? (
                <LostInfoCard
                  label="Recompensa"
                  value={pet.active_reward_text}
                />
              ) : null}
            </div>

            {pet.active_circumstances ? (
              <div className="mt-4 rounded-2xl border border-red-100 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-wide text-red-500">
                  Circunstancias
                </p>
                <p className="mt-2 text-sm leading-6 text-red-900">
                  {pet.active_circumstances}
                </p>
              </div>
            ) : null}

            {pet.active_public_contact_instructions ? (
              <div className="mt-4 rounded-2xl border border-red-100 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-wide text-red-500">
                  Instrucciones
                </p>
                <p className="mt-2 text-sm leading-6 text-red-900">
                  {pet.active_public_contact_instructions}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          {showContact ? (
            <section className="rounded-[28px] border border-neutral-200 bg-white/95 p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-neutral-950">
                Contacto del tutor
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Si tienes información sobre esta mascota, puedes comunicarte directamente.
              </p>

              {pet.show_primary_tutor_phone && phone ? (
                <a
                  href={`tel:${phone}`}
                  className="mt-4 block rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-950 shadow-sm"
                >
                  {phone}
                </a>
              ) : null}

              {pet.show_whatsapp_button && whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Contactar por WhatsApp
                </a>
              ) : null}
            </section>
          ) : (
            <section className="rounded-[28px] border border-neutral-200 bg-white/95 p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-neutral-950">
                Contacto del tutor
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                No hay datos de contacto públicos disponibles para esta mascota.
              </p>
            </section>
          )}

          {showVet ? (
            <section className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-900">
                Veterinaria relacionada
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pet.vet_clinic_name ? (
                  <VetRow label="Clínica" value={pet.vet_clinic_name} />
                ) : null}
                {pet.vet_phone ? (
                  <VetRow label="Teléfono" value={pet.vet_phone} />
                ) : null}
                {pet.vet_state ? (
                  <VetRow label="Estado" value={pet.vet_state} />
                ) : null}
                {pet.vet_municipality ? (
                  <VetRow label="Municipio" value={pet.vet_municipality} />
                ) : null}
              </div>
            </section>
          ) : (
            <section className="rounded-[28px] border border-neutral-200 bg-white/95 p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-neutral-950">
                Veterinaria relacionada
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                No hay una veterinaria registrada públicamente para esta mascota.
              </p>
            </section>
          )}
        </section>

        {pet.show_medical_alerts && pet.medical_alerts ? (
          <section className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-amber-900">
              Información médica importante
            </h2>
            <p className="mt-3 text-sm leading-6 text-amber-800">
              {pet.medical_alerts}
            </p>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-neutral-950">{value}</p>
    </div>
  )
}

function VetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

function LostInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-red-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-red-900">{value}</p>
    </div>
  )
}

function getAgeText(birthDate?: string | null) {
  if (!birthDate) return null

  const birth = new Date(birthDate)
  const now = new Date()

  if (Number.isNaN(birth.getTime())) return null

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (now.getDate() < birth.getDate()) {
    months -= 1
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years > 0 && months > 0) {
    return `${years} año${years > 1 ? 's' : ''}, ${months} mes${months > 1 ? 'es' : ''}`
  }

  if (years > 0) {
    return `${years} año${years > 1 ? 's' : ''}`
  }

  if (months > 0) {
    return `${months} mes${months > 1 ? 'es' : ''}`
  }

  return 'Menos de 1 mes'
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicReportForm from './report-form'

type PageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    type?: string
  }>
}

export default async function PublicReportPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params
  const { type } = await searchParams

  const reportType =
    type === 'found_safe' ? 'found_safe' : type === 'sighting' ? 'sighting' : null

  if (!reportType) {
    notFound()
  }

  const supabase = await createClient()

  const { data: petRows, error } = await supabase.rpc('get_public_pet_profile', {
    p_slug: slug,
  })

  if (error || !petRows || petRows.length === 0) {
    notFound()
  }

  const pet = petRows[0]

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            RAMX · Reporte público
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            {reportType === 'found_safe'
              ? `Reportar que tienes a ${pet.name || 'la mascota'} resguardada`
              : `Reportar avistamiento de ${pet.name || 'la mascota'}`}
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Tu reporte ayudará a mejorar el mapa de búsqueda y avisar al tutor lo antes posible.
          </p>
        </section>

        <PublicReportForm
          petId={pet.pet_id}
          petSlug={slug}
          petName={pet.name || 'Mascota'}
          reportType={reportType}
        />
      </div>
    </main>
  )
}
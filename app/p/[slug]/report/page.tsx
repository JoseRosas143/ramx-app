import { notFound } from 'next/navigation'
import { getPublicPetBySlug } from '@/lib/pets'
import PublicReportForm from './report-form'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function PublicReportPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params
  const { type } = await searchParams

  const pet = await getPublicPetBySlug(slug)

  if (!pet) {
    notFound()
  }

  const reportType = type === 'found_safe' ? 'found_safe' : 'sighting'

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur">
          <p className="text-sm text-neutral-500">Reporte público</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            {reportType === 'found_safe'
              ? `Reportar que tienes a ${pet.name}`
              : `Reportar avistamiento de ${pet.name}`}
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {reportType === 'found_safe'
              ? 'Usa este formulario si encontraste a la mascota y la tienes resguardada.'
              : 'Usa este formulario si viste a la mascota o tienes información reciente sobre su ubicación.'}
          </p>
        </section>

        <PublicReportForm
          petId={pet.pet_id}
          petName={pet.name || 'esta mascota'}
          reportType={reportType}
        />
      </div>
    </main>
  )
}
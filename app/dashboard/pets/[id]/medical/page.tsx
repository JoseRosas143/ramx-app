import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPetMedicalRecord } from '@/lib/medical'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import VaccineForm from './vaccine-form'
import DewormingForm from './deworming-form'
import CollapsibleSection from './collapsible-section'
import MedicalProfileForm from './medical-profile-form'
import MedicalVisitForm from './medical-visit-form'
import MedicalRecordList from './medical-record-list'
import MedicalDocumentForm from './medical-document-form'
import DeleteDocumentButton from './delete-document-button'
import MedicalRemindersPanel from './medical-reminders-panel'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function PetMedicalPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const record = await getPetMedicalRecord(user.id, id)

  if (!record) {
    notFound()
  }

  const {
  pet,
  medicalProfile,
  vaccinations,
  dewormings,
  visits,
  documents,
  reminders,
  vaccineCatalog,
  dewormerCatalog,
} = record

  const nextVaccines = vaccinations.filter((item: any) => item.next_due_date)
  const nextDewormings = dewormings.filter((item: any) => item.next_due_date)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
          >
            ← Volver al dashboard
          </Link>

          <Link
            href={`/dashboard/pets/${pet.id}/edit`}
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
          >
            Editar perfil general
          </Link>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/95 shadow-2xl">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.4fr]">
            <div className="relative min-h-72 bg-gradient-to-br from-amber-100 via-orange-50 to-sky-100">
              {pet.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pet.profile_photo_url}
                  alt={pet.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-72 items-center justify-center text-sm text-neutral-500">
                  Sin foto principal
                </div>
              )}

              <div className="absolute left-5 top-5">
                <Badge className="rounded-full bg-white/90 px-4 py-1 text-neutral-900 shadow-sm">
                  Expediente clínico
                </Badge>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm font-medium text-neutral-500">
                RAMX · Pasaporte médico digital
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                {pet.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                Centraliza información clínica relevante, vacunas, desparasitación, consultas y documentos médicos. Esta sección es privada para el tutor.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Vacunas" value={vaccinations.length} />
                <Metric label="Desparasitación" value={dewormings.length} />
                <Metric label="Consultas" value={visits.length} />
                <Metric label="Documentos" value={documents.length} />
              </div>
            </div>
          </div>
        </section>

        {pet.medical_alerts ? (
          <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-red-900">
              Alerta médica rápida
            </p>
            <p className="mt-2 text-sm leading-6 text-red-800">
              {pet.medical_alerts}
            </p>
          </section>
        ) : null}
        <MedicalRemindersPanel
  petId={pet.id}
  reminders={reminders}
/>

        <section className="grid gap-5 lg:grid-cols-2">
          <CollapsibleSection
            title="Resumen clínico"
            description="Edita datos importantes como alergias, medicamentos, cuidados especiales y veterinaria principal."
            buttonLabel="Editar resumen"
          >
            <MedicalProfileForm
              petId={pet.id}
              medicalProfile={medicalProfile}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Vacunas"
            description="Registra vacunas aplicadas y próxima dosis."
            buttonLabel="Agregar vacuna"
          >
            <VaccineForm petId={pet.id} catalog={vaccineCatalog} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Desparasitación"
            description="Registra desparasitación interna, externa o combinada."
            buttonLabel="Agregar desparasitación"
          >
            <DewormingForm
              petId={pet.id}
              petSpecies={pet.species}
              catalog={dewormerCatalog}
            />
          </CollapsibleSection>

          <CollapsibleSection
  title="Consulta clínica"
  description="Registra motivo, diagnóstico, tratamiento, signos básicos y notas de atención."
  buttonLabel="Nueva consulta"
>
  <MedicalVisitForm petId={pet.id} />
</CollapsibleSection>

<CollapsibleSection
  title="Documento médico"
  description="Sube recetas, certificados, estudios, PDFs o imágenes comprimidas."
  buttonLabel="Subir documento"
>
  <MedicalDocumentForm petId={pet.id} />
</CollapsibleSection>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Card className="rounded-[28px] border-white/70 bg-white/95 shadow-lg lg:col-span-2">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                Resumen clínico
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Datos importantes para atención veterinaria y emergencias.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoBlock
                  label="Peso"
                  value={
                    medicalProfile?.weight_kg
                      ? `${medicalProfile.weight_kg} kg`
                      : 'No registrado'
                  }
                />
                <InfoBlock
                  label="Tipo de sangre"
                  value={medicalProfile?.blood_type || 'No registrado'}
                />
                <InfoBlock
                  label="Alergias"
                  value={medicalProfile?.allergies || 'Sin registro'}
                />
                <InfoBlock
                  label="Enfermedades crónicas"
                  value={medicalProfile?.chronic_conditions || 'Sin registro'}
                />
                <InfoBlock
                  label="Medicamentos actuales"
                  value={medicalProfile?.current_medications || 'Sin registro'}
                />
                <InfoBlock
                  label="Cuidados especiales"
                  value={medicalProfile?.special_care_notes || 'Sin registro'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-white/70 bg-white/95 shadow-lg">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                Veterinaria principal
              </h2>

              <div className="mt-6 space-y-3">
                <InfoBlock
                  label="Veterinario"
                  value={medicalProfile?.primary_vet_name || 'No registrado'}
                />
                <InfoBlock
                  label="Clínica"
                  value={medicalProfile?.primary_vet_clinic || 'No registrada'}
                />
                <InfoBlock
                  label="Teléfono"
                  value={medicalProfile?.primary_vet_phone || 'No registrado'}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        
          <section className="grid gap-5 lg:grid-cols-2">
  <MedicalRecordList
    title="Vacunas"
    emptyText="Aún no hay vacunas registradas."
    records={vaccinations.map((item: any) => ({
      id: item.id,
      title: item.vaccine_name,
      subtitle: item.brand || item.clinic_name || 'Vacuna registrada',
      date: item.applied_date,
      badge: item.next_due_date
        ? `Próxima dosis: ${formatDate(item.next_due_date)}`
        : null,
      fields: [
        { label: 'Vacuna', value: item.vaccine_name },
        { label: 'Marca', value: item.brand },
        { label: 'Fecha aplicada', value: item.applied_date ? formatDate(item.applied_date) : null },
        { label: 'Próxima dosis', value: item.next_due_date ? formatDate(item.next_due_date) : null },
        { label: 'Lote', value: item.batch_number },
        { label: 'Veterinario', value: item.veterinarian_name },
        { label: 'Clínica', value: item.clinic_name },
        { label: 'Notas', value: item.notes },
      ],
    }))}
  />

  <MedicalRecordList
    title="Desparasitación"
    emptyText="Aún no hay desparasitaciones registradas."
    records={dewormings.map((item: any) => ({
      id: item.id,
      title: item.dewormer_name,
      subtitle: item.brand || item.category || 'Desparasitación registrada',
      date: item.applied_date,
      badge: item.next_due_date
        ? `Próxima fecha: ${formatDate(item.next_due_date)}`
        : null,
      fields: [
        { label: 'Desparasitante', value: item.dewormer_name },
        { label: 'Marca', value: item.brand },
        { label: 'Tipo', value: item.category },
        { label: 'Fecha aplicada', value: item.applied_date ? formatDate(item.applied_date) : null },
        { label: 'Próxima aplicación', value: item.next_due_date ? formatDate(item.next_due_date) : null },
        { label: 'Veterinario', value: item.veterinarian_name },
        { label: 'Clínica', value: item.clinic_name },
        { label: 'Notas', value: item.notes },
      ],
    }))}
  />
</section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
          <MedicalRecordList
  title="Consultas clínicas"
  emptyText="Aún no hay consultas registradas."
  records={visits.map((item: any) => ({
    id: item.id,
    title: item.reason,
    subtitle: item.diagnosis || item.clinic_name || 'Consulta médica',
    date: item.visit_date,
    badge: item.treatment ? 'Con tratamiento registrado' : null,
    fields: [
      { label: 'Fecha de consulta', value: item.visit_date ? formatDate(item.visit_date) : null },
      { label: 'Motivo', value: item.reason },
      { label: 'Diagnóstico', value: item.diagnosis },
      { label: 'Tratamiento', value: item.treatment },
      { label: 'Receta / indicaciones', value: item.prescription },
      { label: 'Peso', value: item.weight_kg ? `${item.weight_kg} kg` : null },
      { label: 'Temperatura', value: item.temperature_c ? `${item.temperature_c} °C` : null },
      { label: 'Veterinario', value: item.veterinarian_name },
      { label: 'Clínica', value: item.clinic_name },
      { label: 'Notas', value: item.notes },
    ],
  }))}
 />
          <Card className="rounded-[28px] border-white/70 bg-white/95 shadow-lg">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                Documentos
              </h2>

              {documents.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
                  Aún no hay documentos médicos cargados.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                {documents.map((doc: any) => (
  <div
    key={doc.id}
    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:bg-white hover:shadow-md"
  >
    <div>
      <p className="text-sm font-semibold text-neutral-950">
        {doc.title}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        {doc.document_type}
      </p>

      {doc.notes ? (
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {doc.notes}
        </p>
      ) : null}
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={doc.signed_url || '#'}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        Abrir documento
      </a>

      <DeleteDocumentButton documentId={doc.id} />
    </div>
  </div>
))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">
            Catálogos cargados
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            RAMX ya tiene {vaccineCatalog.length} vacunas y {dewormerCatalog.length} desparasitantes disponibles para futuros menús desplegables.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full">
              Vacunas: {vaccineCatalog.length}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              Desparasitantes: {dewormerCatalog.length}
            </Badge>
            {nextVaccines.length > 0 ? (
              <Badge className="rounded-full bg-amber-100 text-amber-900">
                Próximas vacunas: {nextVaccines.length}
              </Badge>
            ) : null}
            {nextDewormings.length > 0 ? (
              <Badge className="rounded-full bg-sky-100 text-sky-900">
                Próximas desparasitaciones: {nextDewormings.length}
              </Badge>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="text-2xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-neutral-900">{value}</p>
    </div>
  )
}

function TimelineCard({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: {
    id: string
    title: string
    subtitle: string
    date: string
    nextDate: string | null
    notes: string | null
  }[]
}) {
  return (
    <Card className="rounded-[28px] border-white/70 bg-white/95 shadow-lg">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h2>

        {items.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            {emptyText}
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {item.subtitle}
                    </p>
                  </div>

                  <Badge variant="secondary" className="rounded-full">
                    {formatDate(item.date)}
                  </Badge>
                </div>

                {item.nextDate ? (
                  <p className="mt-3 text-xs font-medium text-amber-700">
                    Próxima fecha: {formatDate(item.nextDate)}
                  </p>
                ) : null}

                {item.notes ? (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {item.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(value: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}
 
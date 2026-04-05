import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTutorPetById } from '@/lib/pet-edit'
import EditPetForm from './pet-form'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditPetPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const pet = await getTutorPetById(user.id, id)

  if (!pet) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="space-y-2">
            <p className="text-sm text-neutral-500">Dashboard · Editar perfil</p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
              Editar {pet.name}
            </h1>
            <p className="text-sm leading-6 text-neutral-600">
              Actualiza datos generales, información médica, veterinaria y privacidad pública.
            </p>
          </div>
        </section>

        <EditPetForm pet={pet} />
      </div>
    </main>
  )
}
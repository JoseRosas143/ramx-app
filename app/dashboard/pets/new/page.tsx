import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewPetForm from './new-pet-form'

export default async function NewPetPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, country_code, state, municipality, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-950"
        >
          ← Volver al dashboard
        </Link>

        <NewPetForm profile={profile} />
      </div>
    </main>
  )
}
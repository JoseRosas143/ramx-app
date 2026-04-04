import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-500">Dashboard privado</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Bienvenido a RAMX
              </h1>
              <p className="mt-3 text-neutral-600">
                Sesión iniciada como: {profile?.full_name || user.email}
              </p>
              <p className="mt-1 text-sm text-neutral-500">Email: {user.email}</p>
              <p className="mt-1 text-sm text-neutral-500">
                Rol: {profile?.role || 'tutor'}
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  )
}
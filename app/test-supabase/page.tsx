import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const ok = !!supabase

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Test Supabase</h1>
        <p className="mt-4 text-neutral-600">
          Cliente creado correctamente: {ok ? 'sí' : 'no'}
        </p>
      </div>
    </main>
  )
}
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      Cerrar sesión
    </Button>
  )
}
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1">
          RAMX · Registro Animal MX
        </Badge>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-6xl">
          Identidad digital para mascotas
          <span className="block text-neutral-500">
            con QR, NFC, microchip y red veterinaria
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
          Una plataforma moderna para tutores y veterinarias. Gestiona perfiles
          públicos, extravíos, expediente médico, activación de productos y
          comunicación clínica en un solo lugar.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
  <a href="/auth/register">
    <Button size="lg" className="rounded-2xl px-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      Crear cuenta
    </Button>
  </a>

  <a href="/auth/login">
    <Button variant="outline" size="lg" className="rounded-2xl px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-md">
      Iniciar sesión
    </Button>
  </a>
</div>

        <div className="mt-16 grid w-full gap-6 md:grid-cols-3">
          <Card className="rounded-3xl border-neutral-200 bg-white shadow-sm">
            <CardContent className="p-6 text-left">
              <h3 className="text-lg font-medium text-neutral-900">
                Perfil público
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Cada mascota tiene una identidad pública accesible por QR, NFC o
                microchip.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-neutral-200 bg-white shadow-sm">
            <CardContent className="p-6 text-left">
              <h3 className="text-lg font-medium text-neutral-900">
                Modo extraviado
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Activa alertas, mapa, avistamientos y seguimiento de escaneos en
                tiempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-neutral-200 bg-white shadow-sm">
            <CardContent className="p-6 text-left">
              <h3 className="text-lg font-medium text-neutral-900">
                Red veterinaria
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Expediente conectado, solicitudes de acceso y gestión clínica por
                sucursal.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
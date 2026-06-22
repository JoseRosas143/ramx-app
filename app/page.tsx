'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

const RAMX_LOGO_URL =
  'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Brand%20kit/Logo.jpg'

const RAMX_BANNER_URL =
  'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Brand%20kit/Banner.PNG'

const RAMX_FACEBOOK_URL =
  'https://www.facebook.com/profile.php?id=61591060778332'

const RAMX_INSTAGRAM_URL = 'https://www.instagram.com/ramx.bonica'

const WHATSAPP_URL =
  'https://wa.me/522321416236?text=Hola%20RAMX%2C%20quiero%20informaci%C3%B3n%20sobre%20el%20registro%20digital%20para%20mascotas.'

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
const [searching, setSearching] = useState(false)
const [searchMessage, setSearchMessage] = useState('')

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  const value = search.trim()

  if (!value) {
    setSearchMessage('Escribe un microchip, ID RAMX o enlace de perfil.')
    return
  }

  setSearching(true)
  setSearchMessage('')

  try {
    const response = await fetch(
      `/api/pets/search?q=${encodeURIComponent(value)}`,
      {
        cache: 'no-store',
      }
    )

    const data = (await response.json()) as {
      ok?: boolean
      redirectUrl?: string
      message?: string
    }

    if (!response.ok || !data.ok || !data.redirectUrl) {
      setSearchMessage(
        data.message ||
          'No encontramos una mascota con ese microchip, ID RAMX o enlace público.'
      )
      return
    }

    router.push(data.redirectUrl)
  } catch (error) {
    console.error('RAMX search error:', error)
    setSearchMessage('No se pudo realizar la búsqueda. Intenta nuevamente.')
  } finally {
    setSearching(false)
  }
}

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_42%,#f8fafc_100%)] text-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-14%] h-96 w-96 rounded-full bg-orange-200/50 blur-3xl" />
        <div className="absolute right-[-12%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[22%] h-[30rem] w-[30rem] rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RAMX_LOGO_URL}
              alt="RAMX"
              className="h-10 w-10 rounded-2xl object-cover shadow-sm"
            />

            <span className="text-sm font-semibold tracking-tight text-neutral-950">
              RAMX
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 lg:flex">
            <a href="#buscar" className="transition hover:text-neutral-950">
              Buscar
            </a>
            <a href="#emergencia" className="transition hover:text-neutral-950">
              Emergencia
            </a>
            <a href="#mapa" className="transition hover:text-neutral-950">
              Mapa
            </a>
            <a href="#funciones" className="transition hover:text-neutral-950">
              Funciones
            </a>
            <a href="#veterinarios" className="transition hover:text-neutral-950">
              Veterinarios
            </a>
            <Link href="/tienda" className="transition hover:text-neutral-950">
              Tienda
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-white sm:inline-flex"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-neutral-950/10 transition hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              Crear cuenta
            </Link>
          </div>
        </header>

        <section className="grid gap-12 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700 shadow-sm backdrop-blur">
              Registro Animal MX
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.065em] text-neutral-950 sm:text-6xl lg:text-7xl">
              Protege la identidad digital de tu mascota.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              RAMX reúne registro, QR público, datos importantes, historial
              básico, modo extraviado, avistamientos y herramientas de contacto
              para que tu mascota esté más protegida.
            </p>

            <form
              id="buscar"
              onSubmit={handleSearch}
              className="mt-8 rounded-[28px] border border-white/80 bg-white/85 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Microchip, ID RAMX o enlace del perfil"
                  className="min-h-12 flex-1 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />

                <button
  type="submit"
  disabled={searching}
  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white shadow-lg shadow-neutral-950/10 transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-60"
>
  {searching ? 'Buscando...' : 'Buscar mascota'}
</button>
              </div>

              <div className="mt-3 px-1">
  <p className="text-xs leading-5 text-neutral-500">
    Puedes buscar por microchip, ID interno RAMX, slug público o pegar el enlace
    completo del perfil.
  </p>

  {searchMessage ? (
    <p className="mt-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium leading-5 text-orange-800">
      {searchMessage}
    </p>
  ) : null}
</div>
            </form>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-neutral-950/15 transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                Registrar mi mascota gratis
              </Link>

              <Link
                href="/tienda"
                className="inline-flex items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-6 py-4 text-sm font-semibold text-orange-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md"
              >
                Ver placas QR/NFC
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-orange-200/60 blur-2xl" />
            <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-sky-200/70 blur-2xl" />

            <div className="relative rounded-[42px] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
              <div className="overflow-hidden rounded-[34px] border border-neutral-200 bg-white shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={RAMX_BANNER_URL}
                  alt="RAMX Registro Animal MX"
                  className="h-auto w-full object-cover"
                />

                <div className="grid gap-4 p-5">
                  <InfoRow
                    label="Identidad digital"
                    value="Perfil público para QR, NFC o microchip."
                  />
                  <InfoRow
                    label="Modo extraviado"
                    value="Cartel, ubicación base, contacto y avistamientos."
                  />
                  <InfoRow
                    label="Datos importantes"
                    value="Fotos, señas particulares y alertas médicas."
                  />

                  <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4">
                    <p className="text-sm font-semibold text-orange-950">
                      Diseñado para actuar rápido
                    </p>
                    <p className="mt-1 text-sm leading-6 text-orange-800">
                      Escanea, identifica y contacta desde un perfil público
                      claro y seguro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="emergencia"
          className="grid gap-4 rounded-[40px] border border-white/80 bg-white/75 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur-xl sm:p-8 lg:grid-cols-3"
        >
          <ActionCard
            eyebrow="Extravío"
            title="¿Se perdió tu mascota?"
            text="Activa el modo extraviado desde tu dashboard, agrega foto reciente, ubicación base, recompensa e instrucciones."
            href="/auth/login"
            button="Activar búsqueda"
            tone="orange"
          />

          <ActionCard
            eyebrow="Hallazgo"
            title="¿Encontraste una mascota?"
            text="Busca su ID o microchip en RAMX. Si tiene placa QR/NFC, escanéala para contactar al tutor."
            href="#buscar"
            button="Buscar por ID"
            tone="sky"
          />

          <ActionCard
            eyebrow="Avistamiento"
            title="¿Solo la viste?"
            text="Cuando el perfil público esté activo, podrás reportar avistamientos desde el enlace de la mascota."
            href="#buscar"
            button="Buscar perfil"
            tone="rose"
          />
        </section>

        <section id="mapa" className="grid gap-6 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              Mapa e inteligencia
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl">
              Mapa de mascotas, avistamientos y zonas de búsqueda.
            </h2>

            <p className="mt-4 text-base leading-8 text-neutral-600">
              RAMX concentra la ubicación base del extravío, el radio de
              búsqueda y los reportes de avistamiento para que el tutor tome
              mejores decisiones desde el dashboard.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Extraviadas" value="Modo alerta" />
              <MiniStat label="Avistamientos" value="Reportes" />
              <MiniStat label="Encontradas" value="Seguimiento" />
            </div>
          </div>

          <div className="rounded-[36px] border border-white/80 bg-white/80 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#dbeafe_0%,#fff7ed_52%,#ffffff_100%)]">
              <div className="absolute left-[12%] top-[18%] h-28 w-28 rounded-full border border-orange-300 bg-orange-200/50 blur-sm" />
              <div className="absolute right-[16%] top-[28%] h-24 w-24 rounded-full border border-sky-300 bg-sky-200/60 blur-sm" />
              <div className="absolute bottom-[16%] left-[38%] h-32 w-32 rounded-full border border-rose-300 bg-rose-200/55 blur-sm" />

              <MapPin className="left-[20%] top-[26%]" label="Perdida" />
              <MapPin className="right-[20%] top-[38%]" label="Vista" />
              <MapPin className="bottom-[22%] left-[48%]" label="Reporte" />

              <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/80 bg-white/85 p-4 shadow-xl backdrop-blur">
                <p className="text-sm font-semibold text-neutral-950">
                  Vista conceptual del mapa RAMX
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-600">
                  El mapa real vive en el dashboard del tutor para proteger
                  datos sensibles.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones" className="rounded-[40px] border border-white/80 bg-white/75 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              Funciones de RAMX
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-neutral-950 sm:text-5xl">
              Una plataforma pensada para identidad, cuidado y recuperación.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="🐾"
              title="Registro fácil"
              text="Crea el perfil de tu mascota con fotos, datos físicos, tutor y ubicación general."
            />
            <FeatureCard
              icon="🏷️"
              title="QR y placas"
              text="Genera un perfil público listo para QR, NFC o productos físicos RAMX."
            />
            <FeatureCard
              icon="🩺"
              title="Información médica"
              text="Agrega alertas importantes para emergencias, alergias o cuidados especiales."
            />
            <FeatureCard
              icon="📍"
              title="Modo extraviado"
              text="Activa búsqueda, cartel, ubicación base, recompensa e instrucciones públicas."
            />
            <FeatureCard
              icon="👀"
              title="Avistamientos"
              text="Permite reportes desde el perfil público para apoyar la recuperación."
            />
            <FeatureCard
              icon="🔐"
              title="Privacidad"
              text="El tutor decide qué información se muestra y qué permanece privada."
            />
          </div>
        </section>

        <section className="grid gap-4 py-14 lg:grid-cols-3">
          <SoftPanel
            title="Mascotas perdidas cerca de ti"
            text="En RAMX esta función se integrará al mapa y a los reportes activos."
            action="Ver reportes desde dashboard"
            href="/auth/login"
          />
          <SoftPanel
            title="Mascotas en adopción"
            text="Función futura para publicar mascotas que buscan un hogar responsable."
            action="Próximamente"
            href="/"
          />
          <SoftPanel
            title="Denuncia maltrato animal"
            text="Si presencias maltrato animal en México, reporta a emergencias o denuncia anónima."
            action="Llamar al 911"
            href="tel:911"
          />
        </section>

        <section
          id="veterinarios"
          className="grid gap-8 rounded-[40px] border border-white/80 bg-[linear-gradient(135deg,#fff7ed_0%,#eff6ff_58%,#ffffff_100%)] p-6 shadow-2xl shadow-slate-900/5 backdrop-blur-xl sm:p-8 lg:grid-cols-[0.86fr_1.14fr] lg:p-10"
        >
          <div className="rounded-[32px] bg-neutral-950 p-6 text-white shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
              Portal veterinario
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em]">
              Red médica y expedientes conectados.
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-300">
              RAMX está preparado para crecer hacia una red de veterinarias,
              historial clínico y validación profesional.
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-base leading-8 text-neutral-700 sm:text-lg">
              El objetivo es que el tutor pueda organizar datos importantes de
              su mascota y que, en una fase posterior, veterinarias autorizadas
              puedan participar en el expediente y seguimiento.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                Registrar mascota
              </Link>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Soy veterinario
              </a>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="rounded-[40px] border border-neutral-900 bg-neutral-950 p-6 text-center text-white shadow-2xl shadow-neutral-950/20 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
              En memoria de Niña
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
              Una historia que se convirtió en propósito.
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-neutral-300 sm:text-base">
              RAMX nace en memoria de Niña, una perrita noble, obediente y muy
              querida. Tenía ese espíritu curioso que, cuando sentía que era
              momento de dar un pequeño paseo, encontraba la forma de salir a
              explorar. De esa historia nació una herramienta para ayudar a que
              más mascotas regresen a casa.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                Crear cuenta gratis
              </Link>

              <Link
                href="/tienda"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Ver tienda RAMX
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-14 md:grid-cols-3">
          <TrustStat value="QR" label="Perfil público listo para compartir" />
          <TrustStat value="NFC" label="Preparado para placas inteligentes" />
          <TrustStat value="24/7" label="Perfil accesible cuando más importa" />
        </section>

        <footer className="flex flex-col gap-6 border-t border-neutral-200 py-8 text-sm text-neutral-500 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RAMX_LOGO_URL}
                alt="RAMX"
                className="h-10 w-10 rounded-2xl object-cover"
              />
              <p className="font-semibold text-neutral-800">
                RAMX · Registro Animal MX
              </p>
            </div>

            <p className="mt-3 max-w-md leading-6">
              Identidad digital, protección y herramientas de recuperación para
              mascotas que son parte de casa.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/auth/register" className="font-medium text-neutral-700">
              Registrarse
            </Link>
            <Link href="/auth/login" className="font-medium text-neutral-700">
              Iniciar sesión
            </Link>
            <Link href="/tienda" className="font-medium text-neutral-700">
              Tienda
            </Link>
            <a
              href={RAMX_FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-neutral-700"
            >
              Facebook
            </a>
            <a
              href={RAMX_INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-neutral-700"
            >
              Instagram
            </a>
          </div>
        </footer>
      </section>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-800">{value}</p>
    </div>
  )
}

function ActionCard({
  eyebrow,
  title,
  text,
  href,
  button,
  tone,
}: {
  eyebrow: string
  title: string
  text: string
  href: string
  button: string
  tone: 'orange' | 'sky' | 'rose'
}) {
  const toneClass =
    tone === 'orange'
      ? 'border-orange-200 bg-orange-50 text-orange-900'
      : tone === 'sky'
        ? 'border-sky-200 bg-sky-50 text-sky-900'
        : 'border-rose-200 bg-rose-50 text-rose-900'

  return (
    <article className={`rounded-[30px] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
        {eyebrow}
      </p>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 opacity-80">{text}</p>
      <a
        href={href}
        className="mt-5 inline-flex rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
      >
        {button}
      </a>
    </article>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

function MapPin({ className, label }: { className: string; label: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-neutral-950/20 blur-md" />
        <div className="relative rounded-full bg-neutral-950 px-3 py-2 text-xs font-semibold text-white shadow-xl">
          {label}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text: string
}) {
  return (
    <article className="rounded-[30px] border border-neutral-200 bg-white/80 p-5 shadow-xl shadow-slate-900/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-neutral-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  )
}

function SoftPanel({
  title,
  text,
  action,
  href,
}: {
  title: string
  text: string
  action: string
  href: string
}) {
  return (
    <article className="rounded-[30px] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <h3 className="text-xl font-semibold tracking-tight text-neutral-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-neutral-600">{text}</p>
      <a
        href={href}
        className="mt-5 inline-flex rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        {action}
      </a>
    </article>
  )
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <article className="rounded-[30px] border border-white/80 bg-white/75 p-6 text-center shadow-xl shadow-slate-900/5 backdrop-blur">
      <p className="text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{label}</p>
    </article>
  )
}
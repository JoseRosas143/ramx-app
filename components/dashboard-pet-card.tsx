import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

type Pet = {
  id: string
  name: string
  species: string | null
  breed: string | null
  sex: string | null
  color: string | null
  status: string | null
  public_slug: string | null
  microchip_number: string | null
  internal_id: string | null
  profile_photo_url: string | null
}

export default function DashboardPetCard({ pet }: { pet: Pet }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-lg">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-sky-50">
        {pet.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pet.profile_photo_url}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Sin foto
          </div>
        )}

        <div className="absolute left-4 top-4">
          <Badge
            variant={pet.status === 'lost' ? 'destructive' : 'secondary'}
            className="rounded-full px-3 py-1"
          >
            {pet.status === 'lost' ? 'Extraviada' : 'Activa'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-neutral-950">
            {pet.name}
          </h3>

          <p className="mt-1 text-sm text-neutral-600">
            {pet.species || 'Mascota'} {pet.breed ? `· ${pet.breed}` : ''}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MiniInfo label="Sexo" value={pet.sex || 'No disponible'} />
          <MiniInfo label="Color" value={pet.color || 'No disponible'} />
          <MiniInfo
            label="Microchip / ID"
            value={pet.microchip_number || pet.internal_id || 'No disponible'}
          />
          <MiniInfo
            label="Slug público"
            value={pet.public_slug || 'No disponible'}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/p/${pet.public_slug}`}
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Ver perfil público
          </Link>

          <Link
  href={`/dashboard/pets/${pet.id}/edit`}
  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition-all duration-200 hover:bg-white hover:shadow-md"
>
  Editar perfil
</Link>
        </div>
      </div>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-5 text-neutral-950">
        {value}
      </p>
    </div>
  )
}
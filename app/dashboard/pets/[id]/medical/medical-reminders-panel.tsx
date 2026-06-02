'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { dismissMedicalReminderAction } from './actions'
import { Button } from '@/components/ui/button'

type Reminder = {
  id: string
  pet_id: string
  reminder_kind: string
  title: string
  body: string
  due_date: string
  reminder_date: string
  status: string
  meta: Record<string, any> | null
}

export default function MedicalRemindersPanel({
  petId,
  reminders,
}: {
  petId: string
  reminders: Reminder[]
}) {
  if (!reminders || reminders.length === 0) {
    return (
      <section className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-lg">
            ✓
          </div>

          <div>
            <h2 className="text-lg font-semibold text-emerald-950">
              Sin recordatorios pendientes
            </h2>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              Las vacunas y desparasitaciones con próxima fecha aparecerán aquí automáticamente.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const urgent = reminders.filter((reminder) => getReminderTone(reminder.due_date) === 'overdue')
  const soon = reminders.filter((reminder) => getReminderTone(reminder.due_date) === 'soon')
  const upcoming = reminders.filter((reminder) => getReminderTone(reminder.due_date) === 'upcoming')

  return (
    <section className="rounded-[32px] border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-5 shadow-lg sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            RAMX · Recordatorios
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
            Próximos cuidados médicos
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Estos recordatorios se generan automáticamente desde la próxima fecha registrada en vacunas y desparasitación.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniCounter label="Vencidos" value={urgent.length} tone="red" />
          <MiniCounter label="Pronto" value={soon.length} tone="amber" />
          <MiniCounter label="Activos" value={upcoming.length} tone="sky" />
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            petId={petId}
            reminder={reminder}
          />
        ))}
      </div>
    </section>
  )
}

function ReminderCard({
  petId,
  reminder,
}: {
  petId: string
  reminder: Reminder
}) {
  const [pending, startTransition] = useTransition()
  const tone = getReminderTone(reminder.due_date)
  const days = getDaysUntil(reminder.due_date)

  const styles =
    tone === 'overdue'
      ? 'border-red-200 bg-red-50'
      : tone === 'soon'
        ? 'border-amber-200 bg-amber-50'
        : 'border-sky-200 bg-sky-50'

  const label =
    days < 0
      ? `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`
      : days === 0
        ? 'Vence hoy'
        : `Vence en ${days} día${days === 1 ? '' : 's'}`

  const kindLabel =
    reminder.reminder_kind === 'vaccination_due'
      ? 'Vacuna'
      : reminder.reminder_kind === 'deworming_due'
        ? 'Desparasitación'
        : 'Recordatorio'

  function handleDismiss() {
    const confirmed = window.confirm(
      '¿Quieres descartar este recordatorio? Ya no aparecerá como pendiente.'
    )

    if (!confirmed) return

    const formData = new FormData()
    formData.append('reminder_id', reminder.id)

    startTransition(async () => {
      await dismissMedicalReminderAction(formData)
    })
  }

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${styles}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm">
              {kindLabel}
            </span>

            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm">
              {label}
            </span>

            {reminder.status === 'failed' ? (
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                Error previo
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-base font-semibold text-neutral-950">
            {reminder.title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-neutral-700">
            {reminder.body}
          </p>

          <p className="mt-3 text-xs font-medium text-neutral-500">
            Fecha programada: {formatDate(reminder.due_date)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
          <Link
            href={`/dashboard/pets/${petId}/medical`}
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Ver expediente
          </Link>

          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={handleDismiss}
            className="rounded-2xl bg-white/80"
          >
            {pending ? 'Descartando...' : 'Descartar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MiniCounter({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'red' | 'amber' | 'sky'
}) {
  const styles =
    tone === 'red'
      ? 'bg-red-100 text-red-800'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-sky-100 text-sky-800'

  return (
    <div className={`rounded-2xl px-3 py-2 ${styles}`}>
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </p>
    </div>
  )
}

function getReminderTone(dueDate: string) {
  const days = getDaysUntil(dueDate)

  if (days < 0) return 'overdue'
  if (days <= 7) return 'soon'
  return 'upcoming'
}

function getDaysUntil(value: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(`${value}T00:00:00`)
  due.setHours(0, 0, 0, 0)

  const diff = due.getTime() - today.getTime()

  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function formatDate(value: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}
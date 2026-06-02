'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function CollapsibleSection({
  title,
  description,
  buttonLabel,
  children,
}: {
  title: string
  description?: string
  buttonLabel: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-lg sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {description}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-2xl bg-neutral-950 px-5 text-white hover:bg-neutral-800"
        >
          {open ? 'Cerrar' : buttonLabel}
        </Button>
      </div>

      {open ? <div className="mt-6">{children}</div> : null}
    </section>
  )
}
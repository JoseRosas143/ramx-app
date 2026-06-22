'use client'

import { useFormStatus } from 'react-dom'

export default function AccountSettingsSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg disabled:opacity-60 sm:w-auto"
    >
      {pending ? 'Guardando...' : 'Guardar datos'}
    </button>
  )
}
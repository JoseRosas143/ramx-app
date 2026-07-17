import Link from "next/link";
import { SupportAiChat } from "@/components/support/support-ai-chat";
import { createRamxSupportTicketAction } from "../actions";

type PageProps = {
  searchParams?: Promise<{
    order?: string;
    email?: string;
    error?: string;
  }>;
};

export default async function NewCustomerSupportTicketPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : {};
  const orderNumber = normalizeOrderNumber(query.order);
  const email = normalizeEmail(query.email);
  const error = query.error || "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)] px-4 py-10 text-neutral-950 sm:px-6">
      <section className="mx-auto max-w-4xl space-y-6">
        <Link href="/portal/soporte" className="text-sm font-semibold text-neutral-500 hover:text-neutral-950">
          ← Volver a soporte
        </Link>

        <div className="rounded-[36px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8 lg:p-10">
          <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
            Nueva solicitud
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Cuéntanos qué necesitas resolver.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Vincularemos tu solicitud con tu orden RAMX para revisar pago, preparación, guía, activación, reposición o cualquier detalle de tu compra.
          </p>

          {error ? <ErrorBox error={error} /> : null}

          <div className="mt-8">
            <SupportAiChat orderNumber={orderNumber} email={email} />
          </div>

          <form id="ramx-support-ticket-form" action={createRamxSupportTicketAction} className="mt-8 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Número de orden" name="order_number" defaultValue={orderNumber} placeholder="RAMX-20260703-0017" required />
              <Field label="Correo de compra" name="customer_email" type="email" defaultValue={email} placeholder="tu-correo@email.com" required />
              <Field label="Tu nombre" name="customer_name" placeholder="Nombre completo" />
              <Field label="WhatsApp / teléfono" name="customer_phone" placeholder="Opcional" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Categoría</span>
                <select name="category" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5">
                  <option value="pedido_preventa">Pedido / preventa</option>
                  <option value="pago_mercado_pago">Pago Mercado Pago</option>
                  <option value="activacion_qr_nfc">Activación QR/NFC</option>
                  <option value="registro_mascota">Registro de mascota</option>
                  <option value="modo_extraviado">Modo extraviado</option>
                  <option value="cuenta_acceso">Cuenta y acceso</option>
                  <option value="garantia_reposicion">Garantía / reposición</option>
                  <option value="donacion">Donación</option>
                  <option value="premium_addons">Premium / add-ons</option>
                  <option value="otro">Otro</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Prioridad</span>
                <select name="priority" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5">
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                </select>
              </label>
            </div>

            <Field label="Asunto" name="subject" placeholder="Ej. No puedo activar mi placa" required />

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Mensaje</span>
              <textarea name="description" rows={6} placeholder="Explícanos qué pasó, qué intentaste y cómo podemos ayudarte." className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" required />
            </label>

            <Field label="Link de archivo o evidencia" name="attachment_url" placeholder="Opcional: link a imagen, PDF o comprobante" />

            <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
              Por ahora los adjuntos se agregan como link. En la siguiente etapa conectaremos carga directa de archivos al portal.
            </div>

            <button type="submit" className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 sm:w-auto">
              Crear solicitud RAMX
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({ label, name, type = "text", defaultValue = "", placeholder, required = false }: { label: string; name: string; type?: string; defaultValue?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
    </label>
  );
}

function ErrorBox({ error }: { error: string }) {
  const copy: Record<string, string> = {
    missing: "Faltan datos para crear la solicitud. Revisa número de orden, correo, asunto y mensaje.",
    not_found: "No encontramos una orden con ese número y correo. Usa el correo con el que hiciste la compra.",
  };

  return (
    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
      {copy[error] || "No pudimos crear la solicitud. Intenta de nuevo."}
    </div>
  );
}

function normalizeOrderNumber(value: string | undefined) {
  return String(value || "").trim().toUpperCase().slice(0, 40);
}

function normalizeEmail(value: string | undefined) {
  return String(value || "").trim().toLowerCase().slice(0, 160);
}

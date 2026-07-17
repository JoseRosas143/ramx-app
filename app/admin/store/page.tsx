import Link from "next/link";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { getRamxStoreAdminConfig } from "@/lib/ramx-store-config";
import { formatMxn, type RamxStoreProduct } from "@/lib/ramx-store-products";
import {
  createRamxStoreProductAction,
  toggleRamxStoreProductAction,
  updateRamxStoreProductAction,
  updateRamxStoreSettingsAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{ saved?: string }>;
};

export default async function AdminStorePage({ searchParams }: PageProps) {
  await requireRamxAdmin();

  const query = searchParams ? await searchParams : {};
  const { settings, products, source } = await getRamxStoreAdminConfig();
  const savedMessage = getSavedMessage(query.saved);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            ← Volver a admin
          </Link>

          <Link
            href="/tienda"
            className="rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            Ver tienda
          </Link>
        </div>

        <section className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-sm font-semibold text-orange-700">RAMX · Tienda editable</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Catálogo, preventa y productos sin código
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
            Cambia textos de campaña, meta de ventas, precios, imágenes, orden del carrusel y productos activos. Todo lo que guardes aquí se refleja en /tienda y /tienda/order.
          </p>

          {source === "fallback" ? (
            <div className="mt-5 rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
              La tabla editable aún no respondió. Corre la migración SQL de tienda editable en Supabase para guardar cambios persistentes.
            </div>
          ) : null}

          {savedMessage ? (
            <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
              {savedMessage}
            </div>
          ) : null}
        </section>

        <form
          action={updateRamxStoreSettingsAction}
          className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Preventa</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Campaña de lanzamiento
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Edita la narrativa de la tienda y la meta visual de 200 ventas.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                name="preorder_enabled"
                defaultChecked={settings.preorderEnabled}
                className="h-4 w-4"
              />
              Preventa activa
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TextInput label="Leyenda de preventa" name="preorder_badge" defaultValue={settings.preorderBadge} />
            <TextInput label="CTA principal" name="primary_cta_label" defaultValue={settings.primaryCtaLabel} />
            <NumberInput label="Meta de ventas" name="preorder_goal" defaultValue={settings.preorderGoal} />
            <NumberInput label="Ventas actuales" name="preorder_current_sales" defaultValue={settings.preorderCurrentSales} />
            <TextInput label="CTA donación" name="donation_cta_label" defaultValue={settings.donationCtaLabel} />
            <TextInput label="Título confianza" name="trust_title" defaultValue={settings.trustTitle} />
          </div>

          <div className="mt-4 grid gap-4">
            <TextArea label="Título hero" name="hero_title" defaultValue={settings.heroTitle} rows={2} />
            <TextArea label="Descripción hero" name="hero_description" defaultValue={settings.heroDescription} rows={4} />
            <TextArea label="Título bloque Launch RAMX" name="launch_title" defaultValue={settings.launchTitle} rows={2} />
            <TextArea label="Descripción Launch RAMX" name="launch_description" defaultValue={settings.launchDescription} rows={4} />
            <TextArea label="Descripción confianza" name="trust_description" defaultValue={settings.trustDescription} rows={3} />
            <TextInput label="Título FAQ" name="faq_title" defaultValue={settings.faqTitle} />
          </div>

          <button className="mt-6 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-800">
            Guardar preventa
          </button>
        </form>

        <section className="space-y-4 rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-xl sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Productos</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Catálogo editable
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Puedes cambiar precio, texto, imagen, chips incluidos, badge, CTA y visibilidad. Para productos nuevos, usa una clave única sin espacios.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            {products.map((product) => (
              <ProductEditor key={product.type} product={product} />
            ))}
          </div>
        </section>

        <section className="rounded-[34px] border border-neutral-950 bg-neutral-950 p-5 text-white shadow-2xl shadow-neutral-950/20 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Nuevo producto</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Agregar producto sin código</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Crea un producto físico o una donación. Para que el checkout acepte cualquier producto nuevo, corre la migración incluida que relaja el constraint de product_type.
          </p>

          <form action={createRamxStoreProductAction} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput dark label="Clave interna" name="product_type" placeholder="ej. placa_edicion_azul" />
              <SelectInput dark label="Tipo" name="kind" defaultValue="physical" />
              <NumberInput dark label="Orden" name="sort_order" defaultValue={100} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput dark label="Nombre" name="title" placeholder="Placa Edición Azul" />
              <TextInput dark label="Nombre corto" name="short_title" placeholder="Placa Azul" />
              <NumberInput dark label="Precio" name="price" defaultValue={0} />
              <TextInput dark label="Etiqueta de precio" name="price_label" placeholder="$299 MXN o Monto libre" />
              <TextInput dark label="Badge" name="badge_text" placeholder="Nuevo" />
              <TextInput dark label="CTA" name="cta_label" placeholder="Comprar" />
            </div>

            <TextInput dark label="Imagen" name="image_src" placeholder="https://.../producto.png" />
            <TextArea dark label="Descripción" name="description" rows={3} />
            <TextArea dark label="Incluye, uno por línea" name="includes" rows={4} placeholder={"QR único\nNFC integrado\nActivación RAMX"} />

            <label className="inline-flex items-center gap-2 text-sm font-medium text-white/80">
              <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4" />
              Publicar producto
            </label>

            <button className="w-fit rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-50">
              Agregar producto
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function ProductEditor({ product }: { product: RamxStoreProduct }) {
  const includesText = product.includes.join("\n");

  return (
    <article className="rounded-[30px] border border-neutral-200 bg-neutral-50/70 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {product.type}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">
            {product.title}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {product.kind === "donation" ? product.priceLabel : formatMxn(product.price)} · {product.isActive === false ? "Oculto" : "Activo"}
          </p>
        </div>

        <form action={toggleRamxStoreProductAction}>
          <input type="hidden" name="product_type" value={product.type} />
          <input
            type="hidden"
            name="next_state"
            value={product.isActive === false ? "active" : "hidden"}
          />
          <button className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {product.isActive === false ? "Publicar" : "Ocultar"}
          </button>
        </form>
      </div>

      <form action={updateRamxStoreProductAction} className="mt-5 grid gap-4">
        <input type="hidden" name="original_product_type" value={product.type} />

        <div className="grid gap-4 md:grid-cols-3">
          <SelectInput label="Tipo" name="kind" defaultValue={product.kind} />
          <NumberInput label="Precio" name="price" defaultValue={product.price} />
          <NumberInput label="Orden" name="sort_order" defaultValue={product.sortOrder || 100} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Nombre" name="title" defaultValue={product.title} />
          <TextInput label="Nombre corto" name="short_title" defaultValue={product.shortTitle} />
          <TextInput label="Etiqueta de precio" name="price_label" defaultValue={product.priceLabel} />
          <TextInput label="Badge" name="badge_text" defaultValue={product.badgeText || ""} />
          <TextInput label="CTA" name="cta_label" defaultValue={product.ctaLabel || ""} />
        </div>

        <TextInput label="Imagen" name="image_src" defaultValue={product.imageSrc} />
        <TextArea label="Descripción" name="description" defaultValue={product.description} rows={3} />
        <TextArea label="Incluye, uno por línea" name="includes" defaultValue={includesText} rows={4} />

        <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product.isActive !== false}
            className="h-4 w-4"
          />
          Producto visible en tienda
        </label>

        <button className="w-fit rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-800">
          Guardar producto
        </button>
      </form>
    </article>
  );
}

function TextInput({
  label,
  name,
  defaultValue,
  placeholder,
  dark = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  dark?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className={dark ? "text-sm font-medium text-white/80" : "text-sm font-medium text-neutral-700"}>
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass(dark)}
      />
    </label>
  );
}

function NumberInput({
  label,
  name,
  defaultValue,
  dark = false,
}: {
  label: string;
  name: string;
  defaultValue?: number;
  dark?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className={dark ? "text-sm font-medium text-white/80" : "text-sm font-medium text-neutral-700"}>
        {label}
      </span>
      <input
        name={name}
        type="number"
        min="0"
        step="1"
        defaultValue={defaultValue}
        className={inputClass(dark)}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
  dark = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  dark?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className={dark ? "text-sm font-medium text-white/80" : "text-sm font-medium text-neutral-700"}>
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className={`${inputClass(dark)} h-auto py-3`}
      />
    </label>
  );
}

function SelectInput({
  label,
  name,
  defaultValue,
  dark = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  dark?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className={dark ? "text-sm font-medium text-white/80" : "text-sm font-medium text-neutral-700"}>
        {label}
      </span>
      <select name={name} defaultValue={defaultValue} className={inputClass(dark)}>
        <option value="physical">Producto físico</option>
        <option value="donation">Donación</option>
      </select>
    </label>
  );
}

function inputClass(dark: boolean) {
  return dark
    ? "min-h-12 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white"
    : "min-h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none focus:border-neutral-950";
}

function getSavedMessage(saved?: string) {
  switch (saved) {
    case "settings":
      return "Preventa actualizada.";
    case "product_created":
      return "Producto agregado.";
    case "product_updated":
      return "Producto actualizado.";
    case "product_active":
      return "Producto publicado.";
    case "product_hidden":
      return "Producto ocultado.";
    default:
      return null;
  }
}

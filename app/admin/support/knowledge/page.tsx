import Link from "next/link";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteRamxKnowledgeArticleAction,
  saveRamxKnowledgeArticleAction,
  toggleRamxKnowledgeArticleAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    edit?: string;
    notice?: string;
  }>;
};

type KnowledgeArticle = {
  id: string;
  slug: string | null;
  title: string | null;
  category: string | null;
  keywords: string[] | null;
  content: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  updated_at: string | null;
};

const CATEGORY_OPTIONS = [
  ["concepto", "Concepto RAMX"],
  ["tienda", "Tienda / preventa"],
  ["ordenes", "Órdenes"],
  ["pagos", "Pagos Mercado Pago"],
  ["activacion", "Activación QR/NFC"],
  ["mascotas", "Mascotas"],
  ["extraviado", "Modo extraviado"],
  ["cuenta", "Cuenta y acceso"],
  ["envio", "Envío y guías"],
  ["correos", "Correos"],
  ["addons", "Add-ons / Premium"],
  ["veterinaria", "Veterinaria"],
  ["soporte", "Soporte"],
  ["seguridad", "Privacidad"],
];

export default async function AdminSupportKnowledgePage({ searchParams }: PageProps) {
  await requireRamxAdmin();
  const query = searchParams ? await searchParams : {};
  const articles = await getArticles();
  const editing = articles.find((article) => article.id === query.edit) || null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 text-neutral-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/support" className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-950">
            ← Volver a soporte
          </Link>
          <Link href="/portal/soporte/nuevo" className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-md">
            Probar IA cliente
          </Link>
        </div>

        <section className="rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 sm:p-8">
          <p className="text-sm font-semibold text-sky-700">RAMX · Base de conocimiento</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Entrena el chat de soporte sin tocar código.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">
            Agrega respuestas oficiales para preventa, pagos, guías, activación, garantías, add-ons o procesos internos. El chat IA usará estos artículos junto con la base RAMX del proyecto.
          </p>
        </section>

        {query.notice ? <Notice notice={query.notice} /> : null}

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form action={saveRamxKnowledgeArticleAction} className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-950/5">
            <input type="hidden" name="article_id" value={editing?.id || ""} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">{editing ? "Editar artículo" : "Nuevo artículo"}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Base RAMX</h2>
              </div>
              {editing ? (
                <Link href="/admin/support/knowledge" className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-950">
                  Limpiar
                </Link>
              ) : null}
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Título</span>
              <input name="title" defaultValue={editing?.title || ""} placeholder="Ej. Cómo reportar una placa perdida" required className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
            </label>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_140px]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Categoría</span>
                <select name="category" defaultValue={editing?.category || "soporte"} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5">
                  {CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Orden</span>
                <input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 100} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Palabras clave</span>
              <input name="keywords" defaultValue={(editing?.keywords || []).join(", ")} placeholder="placa perdida, reposición, garantía" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
              <p className="mt-2 text-xs leading-5 text-neutral-500">Sepáralas por coma. Ayudan a que la IA elija el artículo correcto.</p>
            </label>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Respuesta oficial</span>
              <textarea name="content" rows={10} defaultValue={editing?.content || ""} placeholder="Escribe la respuesta o proceso oficial que el asistente debe usar." required className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
            </label>

            <label className="mt-5 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">
              <input name="is_active" type="checkbox" defaultChecked={editing?.is_active ?? true} className="h-4 w-4" />
              Usar este artículo en la IA
            </label>

            <button type="submit" className="mt-5 w-full rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
              {editing ? "Guardar cambios" : "Agregar a la base"}
            </button>
          </form>

          <section className="space-y-4">
            {articles.length > 0 ? articles.map((article) => (
              <article key={article.id} className="rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-xl shadow-blue-950/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">{categoryLabel(article.category)} · orden {article.sort_order ?? 100}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{article.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">{article.content}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${article.is_active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                    {article.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(article.keywords || []).slice(0, 8).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">{keyword}</span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/admin/support/knowledge?edit=${article.id}`} className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:text-neutral-950">
                    Editar
                  </Link>
                  <form action={toggleRamxKnowledgeArticleAction}>
                    <input type="hidden" name="article_id" value={article.id} />
                    <input type="hidden" name="next_active" value={article.is_active ? "false" : "true"} />
                    <button className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:text-neutral-950" type="submit">
                      {article.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <form action={deleteRamxKnowledgeArticleAction}>
                    <input type="hidden" name="article_id" value={article.id} />
                    <button className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100" type="submit">
                      Eliminar
                    </button>
                  </form>
                </div>
              </article>
            )) : (
              <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/80 p-8 text-center text-sm text-neutral-500">
                Aún no hay artículos editables. Agrega el primero para reforzar las respuestas de RAMX IA.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

async function getArticles() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ramx_support_knowledge_articles")
    .select("id,slug,title,category,keywords,content,is_active,sort_order,updated_at")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("RAMX admin knowledge query error:", error.message);
    return [];
  }

  return (data || []) as KnowledgeArticle[];
}

function categoryLabel(value: string | null) {
  return CATEGORY_OPTIONS.find(([key]) => key === value)?.[1] || "Soporte";
}

function Notice({ notice }: { notice: string }) {
  const copy: Record<string, string> = {
    saved: "Artículo guardado. La IA lo usará en próximas respuestas.",
    updated: "Artículo actualizado.",
    deleted: "Artículo eliminado.",
    missing: "Faltan título y respuesta oficial.",
  };

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      {copy[notice] || "Cambio realizado."}
    </div>
  );
}

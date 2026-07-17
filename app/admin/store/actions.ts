"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRamxAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type SaveProductMode = "create" | "update";

export async function updateRamxStoreSettingsAction(formData: FormData) {
  await requireRamxAdmin();
  const admin = createAdminClient();

  const preorderGoal = normalizeInt(formData.get("preorder_goal"), 200);
  const preorderCurrentSales = normalizeInt(
    formData.get("preorder_current_sales"),
    0,
  );

  const { error } = await admin.from("ramx_store_settings").upsert(
    {
      id: "default",
      preorder_enabled: formData.get("preorder_enabled") === "on",
      preorder_badge: cleanText(formData.get("preorder_badge")) || "Preventa fundadora · RAMX",
      preorder_goal: Math.max(preorderGoal, 1),
      preorder_current_sales: Math.max(preorderCurrentSales, 0),
      hero_title: cleanText(formData.get("hero_title")),
      hero_description: cleanText(formData.get("hero_description")),
      launch_title: cleanText(formData.get("launch_title")),
      launch_description: cleanText(formData.get("launch_description")),
      primary_cta_label: cleanText(formData.get("primary_cta_label")) || "Comprar en preventa",
      donation_cta_label: cleanText(formData.get("donation_cta_label")) || "Apoyar con donación",
      trust_title: cleanText(formData.get("trust_title")),
      trust_description: cleanText(formData.get("trust_description")),
      faq_title: cleanText(formData.get("faq_title")) || "Preguntas frecuentes",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`No se pudo guardar la preventa: ${error.message}`);
  }

  revalidateStorePaths();
  redirect("/admin/store?saved=settings");
}

export async function createRamxStoreProductAction(formData: FormData) {
  return saveRamxStoreProduct(formData, "create");
}

export async function updateRamxStoreProductAction(formData: FormData) {
  return saveRamxStoreProduct(formData, "update");
}

export async function toggleRamxStoreProductAction(formData: FormData) {
  await requireRamxAdmin();
  const admin = createAdminClient();

  const productType = cleanText(formData.get("product_type"));
  const nextState = formData.get("next_state") === "active";

  if (!productType) {
    throw new Error("Producto inválido.");
  }

  const { error } = await admin
    .from("ramx_store_products")
    .update({
      is_active: nextState,
      updated_at: new Date().toISOString(),
    })
    .eq("product_type", productType);

  if (error) {
    throw new Error(`No se pudo actualizar el producto: ${error.message}`);
  }

  revalidateStorePaths();
  redirect(`/admin/store?saved=${nextState ? "product_active" : "product_hidden"}`);
}

async function saveRamxStoreProduct(formData: FormData, mode: SaveProductMode) {
  await requireRamxAdmin();
  const admin = createAdminClient();

  const originalProductType = cleanText(formData.get("original_product_type"));
  const title = cleanText(formData.get("title"));
  const kind = cleanText(formData.get("kind")) === "donation" ? "donation" : "physical";
  const productType =
    mode === "update"
      ? originalProductType
      : slugify(cleanText(formData.get("product_type")) || title);

  if (!productType) {
    throw new Error("Agrega una clave para el producto, por ejemplo placa_edicion_azul.");
  }

  if (!title) {
    throw new Error("Agrega el nombre del producto.");
  }

  const price = kind === "donation" ? 0 : normalizeMoney(formData.get("price"));
  const priceLabel =
    cleanText(formData.get("price_label")) ||
    (kind === "donation" ? "Monto libre" : price > 0 ? `$${price} MXN` : "Precio por confirmar");

  const payload = {
    product_type: productType,
    kind,
    title,
    short_title: cleanText(formData.get("short_title")) || title,
    price,
    price_label: priceLabel,
    description:
      cleanText(formData.get("description")) ||
      "Producto RAMX editable desde el panel admin.",
    image_src: cleanText(formData.get("image_src")) || "/images/ramx-donacion.svg",
    includes: parseIncludes(formData.get("includes")),
    is_active: formData.get("is_active") === "on",
    sort_order: normalizeInt(formData.get("sort_order"), 100),
    badge_text: cleanText(formData.get("badge_text")) || null,
    cta_label: cleanText(formData.get("cta_label")) || null,
    updated_at: new Date().toISOString(),
  };

  const query =
    mode === "create"
      ? admin.from("ramx_store_products").insert(payload)
      : admin
          .from("ramx_store_products")
          .update(payload)
          .eq("product_type", productType);

  const { error } = await query;

  if (error) {
    throw new Error(`No se pudo guardar el producto: ${error.message}`);
  }

  revalidateStorePaths();
  redirect(`/admin/store?saved=${mode === "create" ? "product_created" : "product_updated"}`);
}

function revalidateStorePaths() {
  revalidatePath("/tienda");
  revalidatePath("/tienda/order");
  revalidatePath("/admin/store");
}

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeMoney(value: FormDataEntryValue | null) {
  const amount = Number(String(value || "0").replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100) / 100;
}

function normalizeInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
}

function parseIncludes(value: FormDataEntryValue | null) {
  const raw = cleanText(value);
  if (!raw) return ["RAMX"];

  const items = raw
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items.slice(0, 12) : ["RAMX"];
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

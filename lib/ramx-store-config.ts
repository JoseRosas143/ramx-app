import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RAMX_DEFAULT_STORE_PRODUCTS,
  type RamxStoreProduct,
  type RamxStoreProductKind,
} from "@/lib/ramx-store-products";

export type RamxStoreSettings = {
  preorderEnabled: boolean;
  preorderBadge: string;
  preorderGoal: number;
  preorderCurrentSales: number;
  heroTitle: string;
  heroDescription: string;
  launchTitle: string;
  launchDescription: string;
  primaryCtaLabel: string;
  donationCtaLabel: string;
  trustTitle: string;
  trustDescription: string;
  faqTitle: string;
  updatedAt?: string | null;
};

export type RamxStorefrontConfig = {
  settings: RamxStoreSettings;
  products: RamxStoreProduct[];
  source: "database" | "fallback";
};

export const DEFAULT_STORE_SETTINGS: RamxStoreSettings = {
  preorderEnabled: true,
  preorderBadge: "Preventa fundadora · RAMX",
  preorderGoal: 200,
  preorderCurrentSales: 0,
  heroTitle: "Ayúdanos a lanzar la primera red inteligente para mascotas RAMX.",
  heroDescription:
    "Estamos reuniendo las primeras 200 ventas para iniciar producción, activar los códigos QR/NFC y entregar los primeros kits fundadores. Cada compra ayuda a que más mascotas tengan una identidad digital clara, segura y fácil de compartir cuando más se necesita.",
  launchTitle: "Una preventa con propósito.",
  launchDescription:
    "No estás comprando solo una placa. Estás ayudando a construir una herramienta mexicana para que los tutores puedan compartir datos esenciales, activar alertas, conectar con veterinarias y facilitar el regreso a casa de una mascota extraviada.",
  primaryCtaLabel: "Comprar en preventa",
  donationCtaLabel: "Apoyar con donación",
  trustTitle: "Compra segura, activación simple y soporte RAMX.",
  trustDescription:
    "Paga por Mercado Pago, recibe seguimiento por correo y activa tu producto QR/NFC cuando lo tengas en tus manos.",
  faqTitle: "Preguntas frecuentes",
};

type StoreSettingsRow = {
  preorder_enabled?: boolean | null;
  preorder_badge?: string | null;
  preorder_goal?: number | null;
  preorder_current_sales?: number | null;
  hero_title?: string | null;
  hero_description?: string | null;
  launch_title?: string | null;
  launch_description?: string | null;
  primary_cta_label?: string | null;
  donation_cta_label?: string | null;
  trust_title?: string | null;
  trust_description?: string | null;
  faq_title?: string | null;
  updated_at?: string | null;
};

type StoreProductRow = {
  product_type: string;
  kind: RamxStoreProductKind | string | null;
  title: string | null;
  short_title: string | null;
  price: number | string | null;
  price_label: string | null;
  description: string | null;
  image_src: string | null;
  includes: string[] | null;
  is_active: boolean | null;
  sort_order: number | null;
  badge_text: string | null;
  cta_label: string | null;
};

export async function getRamxStorefrontConfig(): Promise<RamxStorefrontConfig> {
  try {
    const admin = createAdminClient();

    const [{ data: settingsRow, error: settingsError }, { data: productRows, error: productsError }] =
      await Promise.all([
        admin
          .from("ramx_store_settings")
          .select(
            "preorder_enabled, preorder_badge, preorder_goal, preorder_current_sales, hero_title, hero_description, launch_title, launch_description, primary_cta_label, donation_cta_label, trust_title, trust_description, faq_title, updated_at",
          )
          .eq("id", "default")
          .maybeSingle(),
        admin
          .from("ramx_store_products")
          .select(
            "product_type, kind, title, short_title, price, price_label, description, image_src, includes, is_active, sort_order, badge_text, cta_label",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (settingsError || productsError) {
      console.warn(
        "RAMX store editable config unavailable; using fallback.",
        settingsError?.message || productsError?.message,
      );
      return fallbackStoreConfig();
    }

    const products = mapStoreProducts(productRows || []);

    return {
      settings: mapStoreSettings(settingsRow),
      products: products.length > 0 ? products : RAMX_DEFAULT_STORE_PRODUCTS,
      source: products.length > 0 ? "database" : "fallback",
    };
  } catch (error) {
    console.warn("RAMX store editable config error; using fallback.", error);
    return fallbackStoreConfig();
  }
}

export async function getRamxActiveStoreProducts() {
  const config = await getRamxStorefrontConfig();
  return config.products;
}

export async function getRamxActiveStoreProduct(type: string | null) {
  if (!type) return null;

  const products = await getRamxActiveStoreProducts();
  return products.find((product) => product.type === type) || null;
}

export async function getRamxStoreAdminConfig(): Promise<RamxStorefrontConfig> {
  try {
    const admin = createAdminClient();

    const [{ data: settingsRow, error: settingsError }, { data: productRows, error: productsError }] =
      await Promise.all([
        admin
          .from("ramx_store_settings")
          .select(
            "preorder_enabled, preorder_badge, preorder_goal, preorder_current_sales, hero_title, hero_description, launch_title, launch_description, primary_cta_label, donation_cta_label, trust_title, trust_description, faq_title, updated_at",
          )
          .eq("id", "default")
          .maybeSingle(),
        admin
          .from("ramx_store_products")
          .select(
            "product_type, kind, title, short_title, price, price_label, description, image_src, includes, is_active, sort_order, badge_text, cta_label",
          )
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (settingsError || productsError) {
      console.warn(
        "RAMX store admin config unavailable; using fallback.",
        settingsError?.message || productsError?.message,
      );
      return fallbackStoreConfig();
    }

    return {
      settings: mapStoreSettings(settingsRow),
      products: mapStoreProducts(productRows || []),
      source: "database",
    };
  } catch (error) {
    console.warn("RAMX store admin config error; using fallback.", error);
    return fallbackStoreConfig();
  }
}

function fallbackStoreConfig(): RamxStorefrontConfig {
  return {
    settings: DEFAULT_STORE_SETTINGS,
    products: RAMX_DEFAULT_STORE_PRODUCTS,
    source: "fallback",
  };
}

function mapStoreSettings(row: StoreSettingsRow | null): RamxStoreSettings {
  return {
    preorderEnabled: row?.preorder_enabled ?? DEFAULT_STORE_SETTINGS.preorderEnabled,
    preorderBadge: row?.preorder_badge || DEFAULT_STORE_SETTINGS.preorderBadge,
    preorderGoal: normalizePositiveInt(row?.preorder_goal, DEFAULT_STORE_SETTINGS.preorderGoal),
    preorderCurrentSales: normalizePositiveInt(
      row?.preorder_current_sales,
      DEFAULT_STORE_SETTINGS.preorderCurrentSales,
    ),
    heroTitle: row?.hero_title || DEFAULT_STORE_SETTINGS.heroTitle,
    heroDescription: row?.hero_description || DEFAULT_STORE_SETTINGS.heroDescription,
    launchTitle: row?.launch_title || DEFAULT_STORE_SETTINGS.launchTitle,
    launchDescription: row?.launch_description || DEFAULT_STORE_SETTINGS.launchDescription,
    primaryCtaLabel: row?.primary_cta_label || DEFAULT_STORE_SETTINGS.primaryCtaLabel,
    donationCtaLabel: row?.donation_cta_label || DEFAULT_STORE_SETTINGS.donationCtaLabel,
    trustTitle: row?.trust_title || DEFAULT_STORE_SETTINGS.trustTitle,
    trustDescription: row?.trust_description || DEFAULT_STORE_SETTINGS.trustDescription,
    faqTitle: row?.faq_title || DEFAULT_STORE_SETTINGS.faqTitle,
    updatedAt: row?.updated_at || null,
  };
}

function mapStoreProducts(rows: StoreProductRow[]): RamxStoreProduct[] {
  return rows
    .filter((row) => row.product_type && row.title)
    .map((row) => ({
      type: row.product_type,
      kind: row.kind === "donation" ? "donation" : "physical",
      title: row.title || row.product_type,
      shortTitle: row.short_title || row.title || row.product_type,
      price: normalizeMoney(row.price),
      priceLabel: row.price_label || (row.kind === "donation" ? "Monto libre" : "Precio por confirmar"),
      description: row.description || "Producto RAMX editable desde el panel admin.",
      imageSrc: row.image_src || "/images/ramx-donacion.svg",
      includes: Array.isArray(row.includes) && row.includes.length > 0 ? row.includes : ["RAMX"],
      isActive: row.is_active ?? true,
      sortOrder: row.sort_order ?? 100,
      badgeText: row.badge_text,
      ctaLabel: row.cta_label,
    }));
}

function normalizeMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100) / 100;
}

function normalizePositiveInt(value: number | null | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

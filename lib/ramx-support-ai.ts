import { createAdminClient } from "@/lib/supabase/admin";
import { buildRamxKnowledgeContext, buildRamxLocalSupportAnswer, type RamxKnowledgeArticle } from "@/lib/ramx-support-knowledge";

export type RamxSupportAiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RamxSupportAiResponse = {
  answer: string;
  shouldCreateTicket: boolean;
  suggestedCategory: string;
  suggestedSubject: string;
};

type OrderContext = {
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: string | null;
  payment_status: string | null;
  total_amount: number | null;
  currency: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  mercado_pago_payment_status: string | null;
  mercado_pago_payment_status_detail: string | null;
  mercado_pago_init_point: string | null;
  mercado_pago_sandbox_init_point: string | null;
  items?: Array<{
    product_name: string | null;
    product_type: string | null;
    quantity: number | null;
    unit_price: number | null;
  }>;
};

const CATEGORY_VALUES = new Set([
  "pedido_preventa",
  "pago_mercado_pago",
  "activacion_qr_nfc",
  "registro_mascota",
  "modo_extraviado",
  "cuenta_acceso",
  "garantia_reposicion",
  "donacion",
  "premium_addons",
  "otro",
]);

export async function getRamxSupportOrderContext(orderNumber: string, email: string) {
  const normalizedOrder = orderNumber.trim().toUpperCase().slice(0, 40);
  const normalizedEmail = email.trim().toLowerCase().slice(0, 160);

  if (!normalizedOrder || !normalizedEmail) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ramx_orders")
      .select(`
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        status,
        payment_status,
        total_amount,
        currency,
        shipping_carrier,
        tracking_number,
        tracking_url,
        mercado_pago_payment_status,
        mercado_pago_payment_status_detail,
        mercado_pago_init_point,
        mercado_pago_sandbox_init_point,
        ramx_order_items(product_name, product_type, quantity, unit_price)
      `)
      .eq("order_number", normalizedOrder)
      .eq("customer_email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("RAMX support AI order lookup error:", error.message);
      return null;
    }

    if (!data) return null;

    const row = data as Record<string, unknown>;
    return {
      order_number: toText(row.order_number),
      customer_name: toText(row.customer_name),
      customer_email: toText(row.customer_email),
      customer_phone: toText(row.customer_phone),
      status: toText(row.status),
      payment_status: toText(row.payment_status),
      total_amount: toNumber(row.total_amount),
      currency: toText(row.currency) || "MXN",
      shipping_carrier: toText(row.shipping_carrier),
      tracking_number: toText(row.tracking_number),
      tracking_url: toText(row.tracking_url),
      mercado_pago_payment_status: toText(row.mercado_pago_payment_status),
      mercado_pago_payment_status_detail: toText(row.mercado_pago_payment_status_detail),
      mercado_pago_init_point: toText(row.mercado_pago_init_point),
      mercado_pago_sandbox_init_point: toText(row.mercado_pago_sandbox_init_point),
      items: normalizeItems(row.ramx_order_items),
    } satisfies OrderContext;
  } catch (error) {
    console.error("RAMX support AI order context failed:", error);
    return null;
  }
}

export async function createRamxSupportAiAnswer(input: {
  messages: RamxSupportAiMessage[];
  orderNumber?: string;
  email?: string;
}) {
  const messages = sanitizeMessages(input.messages);
  const lastMessage = messages[messages.length - 1]?.content || "";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      answer: `${buildRamxLocalSupportAnswer(lastMessage || "ayuda RAMX")}\n\nSi esto no resuelve tu caso, crea una solicitud y el equipo RAMX lo revisará.`,
      shouldCreateTicket: true,
      suggestedCategory: inferCategory(lastMessage),
      suggestedSubject: buildSubject(lastMessage),
    } satisfies RamxSupportAiResponse;
  }

  if (!lastMessage) {
    return {
      answer: "Cuéntame qué necesitas resolver con tu pedido, pago, activación o cuenta RAMX.",
      shouldCreateTicket: false,
      suggestedCategory: "otro",
      suggestedSubject: "Ayuda RAMX",
    } satisfies RamxSupportAiResponse;
  }

  const orderContext = input.orderNumber && input.email
    ? await getRamxSupportOrderContext(input.orderNumber, input.email)
    : null;

  const model = process.env.OPENAI_SUPPORT_MODEL || "gpt-4.1-mini";
  const customArticles = await getEditableRamxKnowledgeArticles();
  const prompt = buildPrompt({ messages, orderContext, customArticles });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 900,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("RAMX OpenAI support assistant error:", payload);
    return {
      answer:
        "No pude consultar al asistente en este momento. Puedes crear una solicitud y el equipo RAMX revisará tu caso con los datos de tu orden.",
      shouldCreateTicket: true,
      suggestedCategory: inferCategory(lastMessage),
      suggestedSubject: buildSubject(lastMessage),
    } satisfies RamxSupportAiResponse;
  }

  const text = extractOutputText(payload);
  const parsed = parseAssistantJson(text);

  return {
    answer: parsed.answer || "Te ayudo. Cuéntame un poco más para orientarte mejor antes de crear un ticket.",
    shouldCreateTicket: Boolean(parsed.shouldCreateTicket),
    suggestedCategory: CATEGORY_VALUES.has(parsed.suggestedCategory) ? parsed.suggestedCategory : inferCategory(lastMessage),
    suggestedSubject: parsed.suggestedSubject || buildSubject(lastMessage),
  } satisfies RamxSupportAiResponse;
}

async function getEditableRamxKnowledgeArticles(): Promise<RamxKnowledgeArticle[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ramx_support_knowledge_articles")
      .select("slug,title,category,keywords,content,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(40);

    if (error) {
      console.error("RAMX editable knowledge query error:", error.message);
      return [];
    }

    return (data || [])
      .map((row: Record<string, unknown>) => ({
        id: `admin-${toText(row.slug) || toText(row.title) || "article"}`,
        title: toText(row.title) || "Artículo RAMX",
        category: toText(row.category) || "soporte",
        keywords: normalizeKeywords(row.keywords),
        content: toText(row.content) || "",
      }))
      .filter((article) => article.title && article.content);
  } catch (error) {
    console.error("RAMX editable knowledge failed:", error);
    return [];
  }
}

function normalizeKeywords(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 20);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function buildPrompt({ messages, orderContext, customArticles }: { messages: RamxSupportAiMessage[]; orderContext: OrderContext | null; customArticles: RamxKnowledgeArticle[] }) {
  const knowledgeContext = buildRamxKnowledgeContext({ messages, orderContextExists: Boolean(orderContext), customArticles });
  const conversation = messages
    .slice(-10)
    .map((message) => `${message.role === "assistant" ? "Asistente RAMX" : "Cliente"}: ${message.content}`)
    .join("\n");

  const orderText = orderContext
    ? JSON.stringify({
        order_number: orderContext.order_number,
        status: orderContext.status,
        payment_status: orderContext.payment_status,
        mercado_pago_payment_status: orderContext.mercado_pago_payment_status,
        mercado_pago_payment_status_detail: orderContext.mercado_pago_payment_status_detail,
        total_amount: orderContext.total_amount,
        currency: orderContext.currency,
        shipping_carrier: orderContext.shipping_carrier,
        tracking_number: orderContext.tracking_number,
        tracking_url: orderContext.tracking_url,
        items: orderContext.items,
      }, null, 2)
    : "No hay orden validada en contexto. Si se requiere información privada, pide número de orden y correo o recomienda crear ticket.";

  return `Eres el asistente de soporte de RAMX. RAMX es una plataforma de identidad digital para mascotas con tienda, preventa, productos físicos QR/NFC, microchip, activación de productos, perfil público, portal de cliente, Mercado Pago y soporte.

Objetivo: resolver dudas antes de que el cliente cree un ticket. Responde como soporte premium: humano, claro, cálido, específico y útil. Evita respuestas genéricas.

Base de conocimiento RAMX que debes usar como fuente principal:
${knowledgeContext}

Reglas de respuesta:
- Responde en español mexicano, con tono amable, seguro y profesional.
- Da pasos concretos cuando aplique. Usa listas cortas, no párrafos largos.
- No inventes datos de orden, pago, guía, fechas de entrega, garantías, reembolsos o disponibilidad.
- Si hay contexto de orden validada, úsalo para orientar: estado, pago, guía, producto y siguiente paso.
- Si el cliente pregunta por datos privados y no hay orden validada, pide número de orden y correo de compra.
- No prometas aprobación de pagos, devoluciones, tiempos exactos de entrega ni garantías automáticas.
- No des diagnóstico ni tratamiento veterinario. En urgencias, recomienda acudir con un veterinario o clínica.
- Para mascota extraviada, orienta a activar modo extraviado, revisar contacto del perfil y crear ticket si necesita intervención humana.
- Si el cliente necesita que RAMX cambie algo, revise pago, modifique dirección/correo, reenvíe correo, desbloquee código, reponga producto o vea una incidencia, marca shouldCreateTicket=true.
- Si lo puedes resolver con instrucciones claras y no requiere revisión humana, marca shouldCreateTicket=false.
- No menciones que usas una base de conocimiento ni detalles técnicos internos.

Criterios para sugerir ticket:
- Pago cobrado pero no confirmado, pago rechazado sin explicación, pedido sin guía que requiere revisión, cambio de dirección, cambio de correo/teléfono, código QR/NFC inválido, producto ya activado por error, problema de acceso persistente, reposición, garantía, devolución, producto faltante, caso sensible o solicitud humana.

Categorías válidas:
pedido_preventa, pago_mercado_pago, activacion_qr_nfc, registro_mascota, modo_extraviado, cuenta_acceso, garantia_reposicion, donacion, premium_addons, otro.

Contexto de orden validada:
${orderText}

Conversación:
${conversation}

Responde ÚNICAMENTE JSON válido con esta forma:
{
  "answer": "respuesta para el cliente con pasos concretos",
  "shouldCreateTicket": true,
  "suggestedCategory": "activacion_qr_nfc",
  "suggestedSubject": "asunto corto para ticket"
}`;
}

function sanitizeMessages(messages: RamxSupportAiMessage[]) {
  return messages
    .filter((message) => message && (message.role === "user" || message.role === "assistant"))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").replace(/\s+/g, " ").trim().slice(0, 1200),
    }))
    .filter((message) => message.content)
    .slice(-10);
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = Array.isArray(record.output) ? record.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") chunks.push(text);
    }
  }
  return chunks.join("\n").trim();
}

function parseAssistantJson(text: string) {
  try {
    const clean = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(clean) as Partial<RamxSupportAiResponse>;
    return {
      answer: typeof parsed.answer === "string" ? parsed.answer.trim() : "",
      shouldCreateTicket: Boolean(parsed.shouldCreateTicket),
      suggestedCategory: typeof parsed.suggestedCategory === "string" ? parsed.suggestedCategory : "otro",
      suggestedSubject: typeof parsed.suggestedSubject === "string" ? parsed.suggestedSubject.trim().slice(0, 120) : "",
    };
  } catch {
    return {
      answer: text.trim(),
      shouldCreateTicket: true,
      suggestedCategory: "otro",
      suggestedSubject: "Ayuda RAMX",
    };
  }
}

function inferCategory(message: string) {
  const text = message.toLowerCase();
  if (text.includes("pago") || text.includes("mercado") || text.includes("tarjeta")) return "pago_mercado_pago";
  if (text.includes("activar") || text.includes("qr") || text.includes("nfc") || text.includes("placa")) return "activacion_qr_nfc";
  if (text.includes("perd") || text.includes("extravi")) return "modo_extraviado";
  if (text.includes("contraseña") || text.includes("login") || text.includes("cuenta")) return "cuenta_acceso";
  if (text.includes("donaci")) return "donacion";
  if (text.includes("premium") || text.includes("seguro") || text.includes("add")) return "premium_addons";
  if (text.includes("garant") || text.includes("reposici")) return "garantia_reposicion";
  return "otro";
}

function buildSubject(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean) return "Ayuda RAMX";
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

function toText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      product_name: toText(record.product_name),
      product_type: toText(record.product_type),
      quantity: toNumber(record.quantity),
      unit_price: toNumber(record.unit_price),
    };
  });
}

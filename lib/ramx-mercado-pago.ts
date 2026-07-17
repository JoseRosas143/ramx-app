import "server-only";
import type { RamxStoreProduct } from "@/lib/ramx-store-products";

const MERCADO_PAGO_API_BASE = "https://api.mercadopago.com";

type CreatePreferenceInput = {
  orderId: string;
  orderNumber: string;
  product: RamxStoreProduct;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  petReference?: string | null;
  notes?: string | null;
};

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  status?: number;
  message?: string;
  error?: string;
  cause?: Array<{ code?: string | number; description?: string }>;
};

type MercadoPagoPaymentResponse = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  date_created?: string;
  date_approved?: string;
  date_last_updated?: string;
  payer?: {
    email?: string;
  };
  metadata?: Record<string, unknown>;
};

type MercadoPagoPaymentSearchResponse = {
  results?: MercadoPagoPaymentResponse[];
  paging?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
  message?: string;
  error?: string;
  cause?: Array<{ code?: string | number; description?: string }>;
};

export type MercadoPagoPreferenceResult = {
  preferenceId: string;
  initPoint: string;
  rawInitPoint?: string | null;
  rawSandboxInitPoint?: string | null;
};

export type MercadoPagoPaymentResult = {
  paymentId: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  transactionAmount: number | null;
  currencyId: string | null;
  payerEmail: string | null;
  dateCreated: string | null;
  dateApproved: string | null;
  dateLastUpdated: string | null;
};

export type RamxPaymentStatus =
  | "unpaid"
  | "manual_pending"
  | "paid"
  | "refunded"
  | "cancelled";

export function isMercadoPagoConfigured() {
  return Boolean(getAccessToken());
}

export function isMercadoPagoTestMode() {
  return getAccessToken()?.startsWith("TEST-") || false;
}

export async function createRamxMercadoPagoPreference(
  input: CreatePreferenceInput,
): Promise<MercadoPagoPreferenceResult> {
  const accessToken = requireAccessToken();
  const appUrl = getAppUrl();
  const notificationUrl = `${appUrl}/api/mercado-pago/webhook`;
  const orderParam = encodeURIComponent(input.orderNumber);
  const unitPrice = normalizeMercadoPagoAmount(input.unitPrice);
  const quantity = normalizeMercadoPagoQuantity(input.quantity);
  const pictureUrl = resolveMercadoPagoPictureUrl(input.product.imageSrc, appUrl);

  if (!unitPrice) {
    throw new Error(
      "Mercado Pago requiere un monto válido mayor a cero para crear la preferencia.",
    );
  }

  const preferenceBody = {
    external_reference: input.orderNumber,
    notification_url: notificationUrl,
    auto_return: "approved",
    back_urls: {
      success: `${appUrl}/tienda/order/success?order=${orderParam}&payment=approved`,
      pending: `${appUrl}/tienda/order/success?order=${orderParam}&payment=pending`,
      failure: `${appUrl}/tienda/order/success?order=${orderParam}&payment=failure`,
    },
    statement_descriptor: "RAMX",
    items: [
      {
        id: input.product.type,
        title: input.product.title,
        description: input.product.description,
        ...(pictureUrl ? { picture_url: pictureUrl } : {}),
        quantity,
        unit_price: unitPrice,
        currency_id: "MXN",
      },
    ],
    payer: {
      name: input.customerName,
      email: input.customerEmail,
      phone: {
        number: input.customerPhone || undefined,
      },
    },
    metadata: {
      ramx_order_id: input.orderId,
      order_number: input.orderNumber,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || null,
      pet_reference: input.petReference || null,
      shipping_address: input.shippingAddress || null,
      notes: input.notes || null,
      total_amount: normalizeMercadoPagoAmount(input.totalAmount) || unitPrice * quantity,
    },
  };

  const response = await fetch(
    `${MERCADO_PAGO_API_BASE}/checkout/preferences`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.orderId,
      },
      body: JSON.stringify(preferenceBody),
    },
  );

  const payload = (await response
    .json()
    .catch(() => ({}))) as MercadoPagoPreferenceResponse;

  if (!response.ok) {
    throw new Error(buildMercadoPagoError(payload, response.status));
  }

  const initPoint = chooseInitPoint(payload);

  if (!payload.id || !initPoint) {
    throw new Error("Mercado Pago no devolvió una preferencia válida.");
  }

  return {
    preferenceId: payload.id,
    initPoint,
    rawInitPoint: payload.init_point || null,
    rawSandboxInitPoint: payload.sandbox_init_point || null,
  };
}

export async function getMercadoPagoPayment(
  paymentId: string,
): Promise<MercadoPagoPaymentResult> {
  const accessToken = requireAccessToken();

  const response = await fetch(
    `${MERCADO_PAGO_API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const payload = (await response
    .json()
    .catch(() => ({}))) as MercadoPagoPaymentResponse & {
    message?: string;
    error?: string;
    cause?: Array<{ code?: string | number; description?: string }>;
  };

  if (!response.ok) {
    throw new Error(buildMercadoPagoError(payload, response.status));
  }

  return normalizeMercadoPagoPayment(payload, paymentId);
}

export async function searchMercadoPagoPaymentsByExternalReference(
  externalReference: string,
): Promise<MercadoPagoPaymentResult[]> {
  const accessToken = requireAccessToken();
  const params = new URLSearchParams({
    external_reference: externalReference,
    sort: "date_created",
    criteria: "desc",
    limit: "20",
  });

  const response = await fetch(
    `${MERCADO_PAGO_API_BASE}/v1/payments/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const payload = (await response
    .json()
    .catch(() => ({}))) as MercadoPagoPaymentSearchResponse;

  if (!response.ok) {
    throw new Error(buildMercadoPagoError(payload, response.status));
  }

  return (payload.results || [])
    .filter((payment) => payment.id)
    .map((payment) => normalizeMercadoPagoPayment(payment));
}

export function chooseBestMercadoPagoPayment(
  payments: MercadoPagoPaymentResult[],
) {
  if (payments.length === 0) return null;

  return (
    payments.find((payment) => payment.status === "approved") ||
    payments.find((payment) => ["pending", "in_process", "authorized"].includes(payment.status)) ||
    payments[0]
  );
}

export function mapMercadoPagoPaymentStatus(status: string): RamxPaymentStatus {
  const normalized = status.toLowerCase();

  if (normalized === "approved") return "paid";
  if (normalized === "refunded" || normalized === "charged_back") return "refunded";
  if (normalized === "cancelled" || normalized === "rejected") return "cancelled";

  return "manual_pending";
}

export function mercadoPagoStatusLabel(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved") return "Pago aprobado";
  if (normalized === "pending") return "Pago pendiente";
  if (normalized === "in_process") return "Pago en revisión";
  if (normalized === "authorized") return "Pago autorizado";
  if (normalized === "rejected") return "Pago rechazado";
  if (normalized === "cancelled") return "Pago cancelado";
  if (normalized === "refunded") return "Pago devuelto";
  if (normalized === "charged_back") return "Contracargo";

  return normalized ? `Mercado Pago: ${normalized}` : "Sin validación de Mercado Pago";
}

function normalizeMercadoPagoPayment(
  payload: MercadoPagoPaymentResponse,
  fallbackPaymentId?: string,
): MercadoPagoPaymentResult {
  return {
    paymentId: String(payload.id || fallbackPaymentId || ""),
    status: payload.status || "unknown",
    statusDetail: payload.status_detail || null,
    externalReference: payload.external_reference || null,
    transactionAmount:
      typeof payload.transaction_amount === "number"
        ? payload.transaction_amount
        : null,
    currencyId: payload.currency_id || null,
    payerEmail: payload.payer?.email || null,
    dateCreated: payload.date_created || null,
    dateApproved: payload.date_approved || null,
    dateLastUpdated: payload.date_last_updated || null,
  };
}

function normalizeMercadoPagoAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null;

  return Math.round(value * 100) / 100;
}

function normalizeMercadoPagoQuantity(value: number) {
  if (!Number.isFinite(value) || value < 1) return 1;

  return Math.max(1, Math.floor(value));
}

function resolveMercadoPagoPictureUrl(imageSrc: string | null, appUrl: string) {
  if (!imageSrc) return null;

  try {
    return new URL(imageSrc, appUrl).toString();
  } catch {
    return null;
  }
}

function chooseInitPoint(payload: MercadoPagoPreferenceResponse) {
  const preferSandbox =
    process.env.MERCADO_PAGO_USE_SANDBOX_LINK === "true" ||
    process.env.MP_USE_SANDBOX_LINK === "true" ||
    getAccessToken()?.startsWith("TEST-");

  if (preferSandbox && payload.sandbox_init_point) {
    return payload.sandbox_init_point;
  }

  return payload.init_point || payload.sandbox_init_point || null;
}

function getAccessToken() {
  return (
    process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || null
  );
}

function requireAccessToken() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Falta MERCADO_PAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN.");
  }

  return token;
}

function getAppUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";

  return rawUrl.replace(/\/$/, "");
}

function buildMercadoPagoError(
  payload: {
    message?: string;
    error?: string;
    cause?: Array<{ code?: string | number; description?: string }>;
  },
  status: number,
) {
  const cause = payload.cause
    ?.map((item) => [item.code, item.description].filter(Boolean).join(": "))
    .filter(Boolean)
    .join(" | ");

  return [
    `Mercado Pago respondió con error ${status}`,
    payload.message || payload.error,
    cause,
  ]
    .filter(Boolean)
    .join(" · ");
}

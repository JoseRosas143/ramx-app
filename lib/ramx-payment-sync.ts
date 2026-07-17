import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  chooseBestMercadoPagoPayment,
  getMercadoPagoPayment,
  mapMercadoPagoPaymentStatus,
  searchMercadoPagoPaymentsByExternalReference,
  type MercadoPagoPaymentResult,
  type RamxPaymentStatus,
} from "@/lib/ramx-mercado-pago";
import { sendRamxPaymentConfirmedEmails } from "@/lib/ramx-order-emails";
import { getRamxActiveStoreProduct } from "@/lib/ramx-store-config";
import type { RamxStoreProductKind } from "@/lib/ramx-store-products";

type SyncSource = "webhook" | "admin" | "success";

type SyncResult = {
  ok: boolean;
  source: SyncSource;
  reason?: string;
  orderNumber?: string;
  paymentId?: string;
  paymentStatus?: RamxPaymentStatus;
  mercadoPagoStatus?: string;
  notified?: boolean;
};

type OrderForPaymentSync = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  confirmed_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number | string | null;
  currency: string | null;
  mercado_pago_payment_notified_at: string | null;
  ramx_order_items?: Array<{
    product_type: string;
    product_name: string | null;
    quantity: number | null;
    unit_price: number | string | null;
  }> | null;
};

export async function syncRamxMercadoPagoByPaymentId(
  paymentId: string,
  source: SyncSource = "webhook",
): Promise<SyncResult> {
  const payment = await getMercadoPagoPayment(paymentId);
  return applyMercadoPagoPaymentToOrder(payment, source);
}

export async function syncRamxMercadoPagoByOrderNumber(
  orderNumber: string,
  source: SyncSource = "admin",
): Promise<SyncResult> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("ramx_orders")
    .select("id, order_number")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo buscar la orden: ${error.message}`);
  }

  if (!order) {
    return { ok: false, source, orderNumber, reason: "order_not_found" };
  }

  const now = new Date().toISOString();

  try {
    const payments = await searchMercadoPagoPaymentsByExternalReference(orderNumber);
    const payment = chooseBestMercadoPagoPayment(payments);

    if (!payment) {
      await admin
        .from("ramx_orders")
        .update({
          mercado_pago_payment_checked_at: now,
          mercado_pago_last_sync_error: "No se encontraron pagos en Mercado Pago para esta orden.",
          updated_at: now,
        })
        .eq("id", order.id);

      return {
        ok: true,
        source,
        orderNumber,
        reason: "payment_not_found",
      };
    }

    return applyMercadoPagoPaymentToOrder(payment, source);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await admin
      .from("ramx_orders")
      .update({
        mercado_pago_payment_checked_at: now,
        mercado_pago_last_sync_error: message,
        updated_at: now,
      })
      .eq("id", order.id);

    throw error;
  }
}

async function applyMercadoPagoPaymentToOrder(
  payment: MercadoPagoPaymentResult,
  source: SyncSource,
): Promise<SyncResult> {
  if (!payment.externalReference) {
    return {
      ok: true,
      source,
      paymentId: payment.paymentId,
      mercadoPagoStatus: payment.status,
      reason: "missing_external_reference",
    };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("ramx_orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      confirmed_at,
      customer_name,
      customer_email,
      total_amount,
      currency,
      mercado_pago_payment_notified_at,
      ramx_order_items (
        product_type,
        product_name,
        quantity,
        unit_price
      )
    `,
    )
    .eq("order_number", payment.externalReference)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la orden RAMX: ${error.message}`);
  }

  if (!order) {
    return {
      ok: false,
      source,
      paymentId: payment.paymentId,
      mercadoPagoStatus: payment.status,
      orderNumber: payment.externalReference,
      reason: "order_not_found",
    };
  }

  const orderRow = order as OrderForPaymentSync;
  const paymentStatus = mapMercadoPagoPaymentStatus(payment.status);
  const now = new Date().toISOString();
  const paidAt = payment.dateApproved || payment.dateLastUpdated || now;
  const payload: Record<string, unknown> = {
    payment_status: paymentStatus,
    payment_provider: "mercado_pago",
    mercado_pago_payment_id: payment.paymentId,
    mercado_pago_payment_status: payment.status,
    mercado_pago_payment_status_detail: payment.statusDetail,
    mercado_pago_payment_updated_at: payment.dateLastUpdated || now,
    mercado_pago_payment_checked_at: now,
    mercado_pago_last_sync_error: null,
    updated_at: now,
  };

  if (paymentStatus === "paid") {
    payload.confirmed_at = orderRow.confirmed_at || paidAt;

    if (!orderRow.status || ["pending", "cancelled"].includes(orderRow.status)) {
      payload.status = "confirmed";
    }
  }

  const { error: updateError } = await admin
    .from("ramx_orders")
    .update(payload)
    .eq("id", orderRow.id);

  if (updateError) {
    throw new Error(`No se pudo sincronizar el pago: ${updateError.message}`);
  }

  let notified = false;

  if (paymentStatus === "paid" && !orderRow.mercado_pago_payment_notified_at) {
    notified = await sendPaymentConfirmedEmail(orderRow, payment, paidAt);

    if (notified) {
      await admin
        .from("ramx_orders")
        .update({
          mercado_pago_payment_notified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderRow.id);
    }
  }

  return {
    ok: true,
    source,
    orderNumber: orderRow.order_number,
    paymentId: payment.paymentId,
    paymentStatus,
    mercadoPagoStatus: payment.status,
    notified,
  };
}

async function sendPaymentConfirmedEmail(
  order: OrderForPaymentSync,
  payment: MercadoPagoPaymentResult,
  paidAt: string,
) {
  const firstItem = Array.isArray(order.ramx_order_items)
    ? order.ramx_order_items[0]
    : null;

  if (!firstItem || !order.customer_email) {
    return false;
  }

  const product = await getRamxActiveStoreProduct(firstItem.product_type);
  const orderKind: RamxStoreProductKind =
    product?.kind || (firstItem.product_type === "donacion_ramx" ? "donation" : "physical");
  const unitPrice = normalizeMoney(firstItem.unit_price);
  const quantity = normalizePositiveInt(firstItem.quantity, 1);
  const totalAmount = normalizeMoney(order.total_amount) || unitPrice * quantity;

  const result = await sendRamxPaymentConfirmedEmails({
    orderNumber: order.order_number,
    orderKind,
    productName: firstItem.product_name || product?.title || firstItem.product_type,
    totalAmount,
    customerName: order.customer_name || "Cliente RAMX",
    customerEmail: order.customer_email,
    paymentId: payment.paymentId,
    paymentStatus: payment.status,
    paymentStatusDetail: payment.statusDetail,
    paidAt,
  });

  return result.sent;
}

function normalizeMoney(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizePositiveInt(value: unknown, fallback: number) {
  const numberValue = Number(value || fallback);
  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.floor(numberValue)
    : fallback;
}

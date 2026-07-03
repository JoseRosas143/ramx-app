import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMercadoPagoPayment,
  mapMercadoPagoPaymentStatus,
} from "@/lib/ramx-mercado-pago";

export async function GET() {
  return NextResponse.json({ ok: true, service: "ramx-mercado-pago-webhook" });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const body = await readJsonBody(request);

  const topic =
    url.searchParams.get("type") ||
    url.searchParams.get("topic") ||
    readString(body?.type) ||
    readString(body?.topic) ||
    "";

  const paymentId =
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    readString(body?.data?.id) ||
    readString(body?.id);

  if (topic && !["payment", "payments"].includes(topic)) {
    return NextResponse.json({ ok: true, ignored: topic });
  }

  if (!paymentId) {
    return NextResponse.json(
      { ok: false, error: "missing_payment_id" },
      { status: 400 },
    );
  }

  try {
    const payment = await getMercadoPagoPayment(paymentId);

    if (!payment.externalReference) {
      return NextResponse.json({
        ok: true,
        ignored: "missing_external_reference",
      });
    }

    const admin = createAdminClient();
    const paymentStatus = mapMercadoPagoPaymentStatus(payment.status);
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      payment_status: paymentStatus,
      payment_provider: "mercado_pago",
      mercado_pago_payment_id: payment.paymentId,
      mercado_pago_payment_status: payment.status,
      mercado_pago_payment_status_detail: payment.statusDetail,
      mercado_pago_payment_updated_at: now,
      updated_at: now,
    };

    if (paymentStatus === "paid") {
      payload.status = "confirmed";
      payload.confirmed_at = now;
    }

    if (paymentStatus === "cancelled") {
      payload.cancelled_at = now;
    }

    const { error } = await admin
      .from("ramx_orders")
      .update(payload)
      .eq("order_number", payment.externalReference);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      order: payment.externalReference,
      payment_status: paymentStatus,
      mercado_pago_status: payment.status,
    });
  } catch (error) {
    console.error("RAMX Mercado Pago webhook error:", error);

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function readString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

import { NextRequest, NextResponse } from "next/server";
import { syncRamxMercadoPagoByPaymentId } from "@/lib/ramx-payment-sync";

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
    readString(body?.resource_type) ||
    "";

  const action = readString(body?.action) || "";
  const paymentId =
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    readString(body?.data?.id) ||
    readString(body?.id);

  if (topic && !["payment", "payments"].includes(topic)) {
    return NextResponse.json({ ok: true, ignored: topic, action });
  }

  if (!paymentId) {
    return NextResponse.json(
      { ok: false, error: "missing_payment_id" },
      { status: 400 },
    );
  }

  try {
    const result = await syncRamxMercadoPagoByPaymentId(paymentId, "webhook");

    return NextResponse.json({
      ok: true,
      action,
      ...result,
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

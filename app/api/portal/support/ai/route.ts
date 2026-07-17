import { NextRequest, NextResponse } from "next/server";
import { createRamxSupportAiAnswer, type RamxSupportAiMessage } from "@/lib/ramx-support-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  messages?: RamxSupportAiMessage[];
  orderNumber?: string;
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as RequestBody | null;
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const result = await createRamxSupportAiAnswer({
      messages,
      orderNumber: String(body?.orderNumber || "").trim().slice(0, 40),
      email: String(body?.email || "").trim().toLowerCase().slice(0, 160),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("RAMX support AI route error:", error);
    return NextResponse.json({
      ok: false,
      answer: "No pude responder con IA en este momento. Puedes crear una solicitud y RAMX revisará tu caso.",
      shouldCreateTicket: true,
      suggestedCategory: "otro",
      suggestedSubject: "Ayuda RAMX",
    }, { status: 200 });
  }
}

"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SupportAiChatProps = {
  orderNumber?: string;
  email?: string;
};

type AiResponse = {
  ok?: boolean;
  answer?: string;
  shouldCreateTicket?: boolean;
  suggestedCategory?: string;
  suggestedSubject?: string;
};

const QUICK_PROMPTS = [
  "No puedo activar mi placa QR/NFC",
  "Quiero saber el estado de mi pedido",
  "Mi pago aparece pendiente",
  "Perdí mi placa RAMX",
];

const CATEGORY_LABELS: Record<string, string> = {
  pedido_preventa: "Pedido / preventa",
  pago_mercado_pago: "Pago Mercado Pago",
  activacion_qr_nfc: "Activación QR/NFC",
  registro_mascota: "Registro de mascota",
  modo_extraviado: "Modo extraviado",
  cuenta_acceso: "Cuenta y acceso",
  garantia_reposicion: "Garantía / reposición",
  donacion: "Donación",
  premium_addons: "Premium / add-ons",
  otro: "Otro",
};

export function SupportAiChat({ orderNumber = "", email = "" }: SupportAiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy el asistente RAMX. Antes de crear un ticket puedo ayudarte con pedidos, pagos, activación QR/NFC, guías, cuenta o preventa. ¿Qué necesitas resolver?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ category: string; subject: string; shouldCreateTicket: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const lastAssistantAnswer = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "assistant")?.content || "";
  }, [messages]);

  async function sendMessage(nextContent?: string) {
    const content = String(nextContent || input).trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/portal/support/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          orderNumber,
          email,
        }),
      });

      const payload = await response.json() as AiResponse;
      const answer = payload.answer || "No pude responder en este momento. Puedes crear una solicitud para que RAMX revise tu caso.";

      setMessages((current) => [...current, { role: "assistant", content: answer }]);
      setSuggestion({
        category: payload.suggestedCategory || "otro",
        subject: payload.suggestedSubject || buildSubject(content),
        shouldCreateTicket: Boolean(payload.shouldCreateTicket),
      });
    } catch {
      setMessages((current) => [...current, {
        role: "assistant",
        content: "No pude conectar con el asistente. Puedes crear una solicitud y el equipo RAMX te ayudará directamente.",
      }]);
      setSuggestion({ category: "otro", subject: buildSubject(content), shouldCreateTicket: true });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function fillTicketForm() {
    const form = document.querySelector<HTMLFormElement>("#ramx-support-ticket-form");
    if (!form) return;

    const category = form.elements.namedItem("category") as HTMLSelectElement | null;
    const subject = form.elements.namedItem("subject") as HTMLInputElement | null;
    const description = form.elements.namedItem("description") as HTMLTextAreaElement | null;

    if (category && suggestion?.category) category.value = suggestion.category;
    if (subject && suggestion?.subject) subject.value = suggestion.subject;
    if (description) {
      const conversation = messages
        .map((message) => `${message.role === "assistant" ? "RAMX IA" : "Cliente"}: ${message.content}`)
        .join("\n\n");
      description.value = `Resumen previo con IA:\n\n${conversation}\n\nRespuesta sugerida:\n${lastAssistantAnswer}`.slice(0, 4000);
    }

    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="rounded-[32px] border border-sky-100 bg-[linear-gradient(135deg,#f0f9ff_0%,#ffffff_45%,#fff7ed_100%)] p-5 shadow-xl shadow-sky-950/5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
            Asistente IA RAMX
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">Resolvamos antes de crear un ticket.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Pregunta sobre tu pedido, pago, activación QR/NFC, guía o cuenta. Si hace falta intervención humana, te ayudamos a preparar la solicitud.
          </p>
        </div>
        {suggestion ? (
          <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-xs text-neutral-600 shadow-sm">
            <p className="font-semibold text-neutral-950">Sugerencia</p>
            <p>{CATEGORY_LABELS[suggestion.category] || "Soporte"}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-[26px] border border-white/80 bg-white/70 p-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "bg-neutral-950 text-white" : "border border-neutral-100 bg-white text-neutral-700"}`}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading ? (
          <div className="flex justify-start">
            <div className="rounded-[22px] border border-neutral-100 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm">
              RAMX está revisando tu caso...
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:-translate-y-0.5 hover:border-neutral-400 hover:text-neutral-950">
            {prompt}
          </button>
        ))}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu duda antes de crear el ticket..." className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5" />
        <button disabled={isLoading || !input.trim()} className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" type="submit">
          Preguntar
        </button>
      </form>

      {suggestion?.shouldCreateTicket ? (
        <div className="mt-4 rounded-[24px] border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Parece que este caso podría requerir revisión del equipo RAMX.
          <button type="button" onClick={fillTicketForm} className="ml-0 mt-3 block rounded-2xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 sm:ml-3 sm:mt-0 sm:inline-flex">
            Preparar ticket con esta conversación
          </button>
        </div>
      ) : null}
    </section>
  );
}

function buildSubject(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "Ayuda RAMX";
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

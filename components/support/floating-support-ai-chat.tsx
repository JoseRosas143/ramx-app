"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AiResponse = {
  ok?: boolean;
  answer?: string;
  shouldCreateTicket?: boolean;
  suggestedCategory?: string;
  suggestedSubject?: string;
};

const QUICK_PROMPTS = [
  "Consultar pedido",
  "Activar placa",
  "Pago pendiente",
  "Perdí mi placa",
];

export function FloatingSupportAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy RAMX IA. Puedo ayudarte con pedidos, pagos, activación QR/NFC, preventa o modo extraviado. ¿Qué necesitas resolver?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ticketSuggestion, setTicketSuggestion] = useState<{ category: string; subject: string } | null>(null);

  const supportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (ticketSuggestion?.category) params.set("category", ticketSuggestion.category);
    if (ticketSuggestion?.subject) params.set("subject", ticketSuggestion.subject);
    const query = params.toString();
    return `/portal/soporte/nuevo${query ? `?${query}` : ""}`;
  }, [ticketSuggestion]);

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
        body: JSON.stringify({ messages: nextMessages }),
      });
      const payload = (await response.json()) as AiResponse;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.answer || "No pude responder en este momento. Puedes crear una solicitud y RAMX te ayudará.",
        },
      ]);
      if (payload.shouldCreateTicket) {
        setTicketSuggestion({
          category: payload.suggestedCategory || "otro",
          subject: payload.suggestedSubject || buildSubject(content),
        });
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "No pude conectar con el asistente. Puedes crear una solicitud y el equipo RAMX revisará tu caso.",
        },
      ]);
      setTicketSuggestion({ category: "otro", subject: buildSubject(content) });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div className="mb-4 w-[calc(100vw-2rem)] max-w-[410px] overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
          <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#fb923c_100%)] p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-100">RAMX IA</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">¿Necesitas ayuda?</h2>
                <p className="mt-1 text-xs leading-5 text-white/75">Resolvemos dudas antes de crear un ticket.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white transition hover:bg-white/20"
                aria-label="Cerrar chat RAMX"
              >
                ×
              </button>
            </div>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto bg-neutral-50 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "bg-neutral-950 text-white" : "border border-neutral-100 bg-white text-neutral-700"}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm">
                  Consultando RAMX...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-neutral-100 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {ticketSuggestion ? (
              <Link href={supportHref} className="mb-3 flex items-center justify-center rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100">
                Crear ticket con soporte RAMX
              </Link>
            ) : null}

            <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escribe tu duda..."
                className="min-w-0 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/5"
              />
              <button
                disabled={isLoading || !input.trim()}
                className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                type="submit"
              >
                Enviar
              </button>
            </form>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
              <Link href="/portal" className="rounded-2xl border border-neutral-200 px-3 py-2 text-neutral-600 transition hover:text-neutral-950">
                Portal cliente
              </Link>
              <Link href="/portal/ordenes" className="rounded-2xl border border-neutral-200 px-3 py-2 text-neutral-600 transition hover:text-neutral-950">
                Ver pedido
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full border border-white/80 bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-neutral-800"
        aria-label="Abrir chat de soporte RAMX"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-neutral-950">🐾</span>
        <span className="hidden sm:block">Ayuda RAMX</span>
      </button>
    </div>
  );
}

function buildSubject(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "Ayuda RAMX";
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

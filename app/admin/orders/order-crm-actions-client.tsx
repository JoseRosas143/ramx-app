"use client";

import { useState, useTransition } from "react";

type OrderCrmActionsClientProps = {
  orderNumber: string;
  summary: string;
  supportHref: string;
};

export default function OrderCrmActionsClient({
  orderNumber,
  summary,
  supportHref,
}: OrderCrmActionsClientProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function copySummary() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } catch {
        setCopied(false);
        window.prompt("Copia el resumen del pedido", summary);
      }
    });
  }

  function printSummary() {
    const printWindow = window.open("", "_blank", "width=820,height=720");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Resumen ${escapeHtml(orderNumber)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; padding: 32px; }
            .card { border: 1px solid #e5e7eb; border-radius: 24px; padding: 28px; max-width: 720px; margin: 0 auto; }
            .eyebrow { color: #f97316; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
            h1 { margin: 8px 0 20px; font-size: 28px; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.7; }
            .footer { margin-top: 28px; color: #6b7280; font-size: 12px; }
            @media print { body { padding: 0; } .card { border: 0; } }
          </style>
        </head>
        <body>
          <main class="card">
            <p class="eyebrow">RAMX · Resumen de pedido</p>
            <h1>${escapeHtml(orderNumber)}</h1>
            <pre>${escapeHtml(summary)}</pre>
            <p class="footer">RAMX · Registro Animal MX · Identidad digital para mascotas.</p>
          </main>
          <script>
            window.addEventListener('load', () => {
              window.print();
              window.setTimeout(() => window.close(), 500);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copySummary}
        className="inline-flex h-10 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 text-xs font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-60"
        disabled={isPending}
      >
        {copied ? "Copiado" : "Copiar resumen"}
      </button>

      <button
        type="button"
        onClick={printSummary}
        className="inline-flex h-10 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 text-xs font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        Imprimir resumen
      </button>

      <a
        href={supportHref}
        aria-disabled="true"
        onClick={(event) => event.preventDefault()}
        className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 text-xs font-semibold text-neutral-400"
        title="Se activará cuando construyamos el portal de soporte RAMX."
      >
        Abrir ticket · pronto
      </a>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

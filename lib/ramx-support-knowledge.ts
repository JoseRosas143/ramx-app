export type RamxKnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
};

export const RAMX_STATIC_KNOWLEDGE_BASE: RamxKnowledgeArticle[] = [
  {
    id: "ramx-overview",
    title: "Qué es RAMX",
    category: "concepto",
    keywords: ["ramx", "que es", "identidad", "mascota", "perfil", "ecosistema"],
    content:
      "RAMX es un ecosistema digital para mascotas. Permite crear una identidad digital para una mascota, conectarla con una placa QR/NFC o microchip, guardar datos importantes y abrir un perfil público para ayudar a que pueda volver a casa si se extravía. El perfil público se abre desde una URL tipo /p/[identificador] y puede mostrar datos de contacto, salud relevante, estado extraviado, ubicación/reportes y datos que el tutor decida compartir.",
  },
  {
    id: "store-products",
    title: "Productos RAMX en preventa",
    category: "tienda",
    keywords: ["producto", "precio", "tienda", "preventa", "placa", "combo", "donacion", "donación", "comprar"],
    content:
      "La tienda RAMX maneja preventa fundadora. Productos principales: Placa Inteligente NFC/Qr por $199 MXN; Combo Identificación Inteligente por $475 MXN; Combo Identidad Inteligente por $820 MXN. También existe Donación RAMX con monto libre, normalmente desde $10 MXN. La meta de preventa es juntar 200 ventas para impulsar el lanzamiento de RAMX. Los precios pueden cambiar si el equipo RAMX actualiza la tienda desde el admin.",
  },
  {
    id: "order-flow",
    title: "Cómo comprar y consultar una orden",
    category: "ordenes",
    keywords: ["orden", "pedido", "comprar", "correo", "numero de orden", "número de orden", "portal", "seguimiento"],
    content:
      "Para comprar no es obligatorio tener cuenta. El cliente puede crear una orden desde /tienda/order con nombre, correo, teléfono y dirección cuando sea producto físico. Al finalizar recibe un número de orden tipo RAMX-AAAAMMDD-0000. Puede consultar la orden en /portal/ordenes usando correo de compra + número de orden. El portal muestra producto, total, estado de pago, estado operativo, guía/rastreo si existe, producto asignado y botón de activación cuando aplique.",
  },
  {
    id: "order-statuses",
    title: "Estados de pedido y pago",
    category: "ordenes",
    keywords: ["estatus", "estado", "pendiente", "produccion", "producción", "entregado", "guia", "guía", "rastreo"],
    content:
      "Estados operativos posibles de una orden: pending/pendiente, confirmed/confirmada, in_production/en preparación, ready/lista o producto asignado, delivered/entregada, returned/devuelta, cancelled/cancelada. Estados de pago: unpaid/sin pagar, manual_pending/pendiente, paid/aprobado, refunded/devuelto, cancelled/cancelado. Si hay paquetería, número de guía o URL de rastreo, se muestran en admin, success page y portal del cliente.",
  },
  {
    id: "mercado-pago",
    title: "Mercado Pago y pagos",
    category: "pagos",
    keywords: ["mercado pago", "pago", "tarjeta", "aprobado", "rechazado", "pendiente", "completar pago", "link de pago"],
    content:
      "RAMX usa Mercado Pago Checkout Pro. La orden genera una preferencia y abre el checkout de Mercado Pago. Si el pago se aprueba, RAMX debe actualizar payment_status a paid y mostrar pago confirmado. Si el pago queda pendiente, el cliente debe esperar confirmación. Si falla o se rechaza, puede intentar pagar de nuevo desde el link de pago en /tienda/order/success o desde el portal, si el link sigue disponible. El asistente no debe confirmar pagos sin contexto validado de orden ni prometer aprobaciones; si hay duda, sugerir crear ticket o verificar desde admin.",
  },
  {
    id: "activation-flow",
    title: "Activación de placa QR/NFC o producto físico",
    category: "activacion",
    keywords: ["activar", "activacion", "activación", "qr", "nfc", "codigo", "código", "placa", "vincular", "mascota"],
    content:
      "Cada producto físico puede tener un código único. El QR/NFC abre /r/[codigo]. Si el producto no está activado, RAMX redirige a /activate/[codigo]. El cliente inicia sesión o crea cuenta, selecciona o registra una mascota y vincula el producto. Cuando queda activado, /r/[codigo] redirige al perfil público de la mascota. Si el código no existe, ya fue activado en otra mascota, está bloqueado o no aparece en el portal, requiere revisión humana/ticket.",
  },
  {
    id: "pet-profile",
    title: "Perfil público y datos de mascota",
    category: "mascotas",
    keywords: ["perfil", "mascota", "microchip", "id", "fotos", "datos", "salud", "publico", "público"],
    content:
      "El tutor puede registrar mascotas, agregar datos generales, fotos, datos de salud relevantes, notas, documentos y configurar el perfil público. Si la mascota tiene microchip, puede usarse como identificador; si no, RAMX genera un ID interno. El tutor decide qué datos mostrar. El objetivo del perfil público es ayudar a contactar al tutor de forma rápida si alguien escanea la placa.",
  },
  {
    id: "lost-mode",
    title: "Modo extraviado y reportes",
    category: "extraviado",
    keywords: ["extraviado", "perdido", "perdida", "perdí", "perdi", "encontré", "avistamiento", "mapa", "ubicacion", "ubicación"],
    content:
      "RAMX tiene modo extraviado para mascotas. Cuando se activa, el perfil público puede mostrar que la mascota está extraviada y facilitar contacto/reporte de avistamiento. Si alguien escanea la placa puede reportar información para ayudar a localizarla. Para una mascota extraviada, recomendar actualizar el perfil, activar modo extraviado y revisar datos de contacto. Si necesita ayuda urgente o cambios que no puede hacer, crear ticket. RAMX no sustituye acciones locales como buscar en la zona, avisar a vecinos, refugios o veterinarias.",
  },
  {
    id: "account-access",
    title: "Cuenta, registro y acceso",
    category: "cuenta",
    keywords: ["cuenta", "login", "iniciar sesión", "registrar", "contraseña", "correo", "no puedo entrar"],
    content:
      "Para administrar mascotas o activar productos se requiere una cuenta RAMX. Si el cliente no puede entrar, debe revisar que use el correo correcto, intentar recuperar contraseña y verificar su correo. Si la activación redirige a login, debe iniciar sesión y volver al enlace /activate/[codigo] o /r/[codigo]. Si sigue sin acceso, crear ticket con correo usado y número de orden/código si lo tiene.",
  },
  {
    id: "shipping-preorder",
    title: "Preventa, preparación, envío y guías",
    category: "envio",
    keywords: ["envío", "envio", "guía", "guia", "paquetería", "paqueteria", "cuando llega", "llega", "preparación", "preparacion"],
    content:
      "RAMX está en preventa fundadora. El estado puede pasar de recibido a confirmado, preparación, listo/asignado y entregado. Si ya existe número de guía o link de rastreo, el cliente lo ve en el portal de orden. Si no hay guía todavía, no se debe inventar fecha de entrega; explicar que RAMX notificará cuando el pedido avance o sugerir crear ticket si el cliente necesita revisión puntual.",
  },
  {
    id: "emails-notifications",
    title: "Correos transaccionales RAMX",
    category: "correos",
    keywords: ["correo", "email", "notificacion", "notificación", "confirmacion", "confirmación", "no me llego", "no me llegó"],
    content:
      "RAMX envía correos de orden recibida, pago confirmado, pedido en preparación, producto asignado/listo, envío con guía, entrega, devolución y activación. Si el cliente no recibe correo, pedir revisar spam/promociones, confirmar que el correo de compra esté bien escrito y consultar la orden desde /portal/ordenes. Si el correo está mal o necesita reenvío, crear ticket.",
  },
  {
    id: "support-tickets",
    title: "Cuándo crear ticket",
    category: "soporte",
    keywords: ["ticket", "soporte", "ayuda", "humano", "solicitud", "problema", "revisión", "revision"],
    content:
      "Crear ticket cuando se necesita intervención humana: pago cobrado pero no aparece aprobado, cambio de dirección/correo/teléfono, pedido sin guía después de revisión, código QR/NFC inválido o ya activado, no puede acceder a cuenta, reposición/garantía, devolución, producto faltante, cambio de datos sensibles o caso urgente de mascota extraviada. El ticket debe incluir orden, correo de compra, descripción, evidencia o links de adjuntos si aplica.",
  },
  {
    id: "addons-premium",
    title: "Add-ons, reposición, seguro y premium",
    category: "addons",
    keywords: ["premium", "add-on", "addons", "seguro", "reposición", "reposicion", "placa extra", "perdida de placa", "pérdida de placa"],
    content:
      "El portal puede mostrar add-ons como reposición/seguro por pérdida de placa, placa extra, plan premium RAMX y donación. Si un add-on todavía no está disponible para compra automática, el asistente debe explicar que RAMX puede revisarlo y sugerir crear ticket o visitar /portal/add-ons.",
  },
  {
    id: "veterinary-module",
    title: "Módulo veterinario",
    category: "veterinaria",
    keywords: ["veterinaria", "veterinario", "doctor", "clinica", "clínica", "expediente", "vacunas", "desparasitación"],
    content:
      "RAMX contempla un módulo veterinario/red veterinaria donde clínicas o doctores podrán solicitar acceso autorizado al expediente, agregar vacunas, desparasitaciones, notas clínicas e imprimir documentos. En la etapa MVP, algunas funciones pueden estar en desarrollo. No dar diagnóstico médico ni tratamiento; para urgencias clínicas recomendar acudir con un veterinario.",
  },
  {
    id: "privacy-security",
    title: "Privacidad y seguridad",
    category: "seguridad",
    keywords: ["privacidad", "datos", "seguridad", "publico", "público", "telefono", "teléfono"],
    content:
      "RAMX debe manejar datos con cuidado. No exponer datos sensibles si el cliente no validó orden/correo. El perfil público solo debe mostrar información útil y autorizada por el tutor. Para cambios de correo, teléfono, dirección o datos sensibles, pedir verificación por ticket.",
  },
];

export function buildRamxKnowledgeContext(input: { messages: Array<{ role: string; content: string }>; orderContextExists: boolean; customArticles?: RamxKnowledgeArticle[] }) {
  const text = input.messages
    .map((message) => message.content || "")
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const knowledgeBase = mergeKnowledgeArticles(RAMX_STATIC_KNOWLEDGE_BASE, input.customArticles || []);

  const scored = knowledgeBase.map((article) => {
    const title = normalize(article.title);
    const category = normalize(article.category);
    const keywordScore = article.keywords.reduce((score, keyword) => {
      const clean = normalize(keyword);
      return score + (text.includes(clean) ? 4 : 0);
    }, 0);
    const titleScore = text.includes(title) ? 3 : 0;
    const categoryScore = text.includes(category) ? 2 : 0;
    const baseScore = ["ramx-overview", "support-tickets", "privacy-security"].includes(article.id) ? 1 : 0;
    return { article, score: keywordScore + titleScore + categoryScore + baseScore };
  })
    .sort((a, b) => b.score - a.score);

  const selected = scored
    .filter((item) => item.score > 0)
    .slice(0, 7)
    .map((item) => item.article);

  if (!selected.some((article) => article.id === "ramx-overview")) {
    selected.unshift(knowledgeBase[0]);
  }

  if (!selected.some((article) => article.id === "support-tickets")) {
    const support = knowledgeBase.find((article) => article.id === "support-tickets");
    if (support) selected.push(support);
  }

  const articles = selected
    .slice(0, 8)
    .map((article) => `### ${article.title}\nCategoría: ${article.category}\n${article.content}`)
    .join("\n\n");

  const orderNote = input.orderContextExists
    ? "### Contexto privado validado\nHay una orden validada con correo + número de orden. Puedes usar sus estados sin pedirlos de nuevo."
    : "### Contexto privado no validado\nNo hay orden validada. Para datos de pago, guía, dirección o cambios de pedido, pide número de orden + correo o sugiere ticket.";

  return `${orderNote}\n\n${articles}`;
}

export function buildRamxLocalSupportAnswer(message: string) {
  const text = normalize(message);
  const match = RAMX_STATIC_KNOWLEDGE_BASE
    .map((article) => ({
      article,
      score: article.keywords.reduce((score, keyword) => score + (text.includes(normalize(keyword)) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (!match || match.score === 0) {
    return "Puedo ayudarte con pedidos, pagos, activación QR/NFC, cuenta, modo extraviado o preventa. Cuéntame qué ocurrió y, si tienes una orden, comparte el número de orden y el correo de compra.";
  }

  return match.article.content;
}

function mergeKnowledgeArticles(staticArticles: RamxKnowledgeArticle[], customArticles: RamxKnowledgeArticle[]) {
  const byId = new Map<string, RamxKnowledgeArticle>();

  for (const article of staticArticles) {
    byId.set(article.id, article);
  }

  for (const article of customArticles) {
    if (!article.title || !article.content) continue;
    byId.set(article.id || `custom-${normalize(article.title)}`, {
      ...article,
      keywords: Array.isArray(article.keywords) ? article.keywords : [],
    });
  }

  return Array.from(byId.values());
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

import "server-only";
import nodemailer from "nodemailer";
import {
  formatMxn,
  type RamxStoreProductKind,
} from "@/lib/ramx-store-products";

const RAMX_BANNER_URL =
  process.env.RAMX_ORDER_EMAIL_BANNER_URL ||
  "https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Brand%20kit/5B003718-18AF-4F78-A612-37EFDB637D53.png";

const DEFAULT_ADMIN_EMAIL = "ramx@bonica.com.mx";

type OrderEmailInput = {
  orderNumber: string;
  orderKind?: RamxStoreProductKind;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  petName?: string | null;
  petReference?: string | null;
  shippingMethod: string;
  shippingAddress?: string | null;
  notes?: string | null;
  paymentUrl?: string | null;
  portalUrl?: string | null;
};

type PaymentConfirmedEmailInput = {
  orderNumber: string;
  orderKind?: RamxStoreProductKind;
  productName: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentStatusDetail?: string | null;
  paidAt?: string | null;
  portalUrl?: string | null;
};

export type RamxOrderStatusEmailKind =
  | "in_production"
  | "ready"
  | "shipped"
  | "delivered"
  | "returned";

type OrderStatusUpdateEmailInput = {
  kind: RamxOrderStatusEmailKind;
  orderNumber: string;
  orderKind?: RamxStoreProductKind;
  productName: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  portalUrl?: string | null;
  updatedAt?: string | null;
};

type ProductAssignedEmailInput = {
  orderNumber: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  code: string;
  activationUrl: string;
  portalUrl?: string | null;
  assignedAt?: string | null;
};

let transporterCache: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporterCache) return transporterCache;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  transporterCache = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporterCache;
}

function getFromHeader() {
  const fromHeader = process.env.SMTP_FROM;

  if (fromHeader) return fromHeader;

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "RAMX";

  return fromEmail ? `"${fromName}" <${fromEmail}>` : null;
}

export async function sendRamxOrderEmails(input: OrderEmailInput) {
  const transporter = getTransporter();
  const from = getFromHeader();

  if (!transporter || !from) {
    console.warn("SMTP no configurado. Se omiten correos de orden RAMX.");
    return { sent: false, reason: "smtp-not-configured" as const };
  }

  const adminEmail =
    process.env.RAMX_ORDERS_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;

  const isDonation = input.orderKind === "donation";
  const subjectPrefix = isDonation ? "Nueva donación" : "Nueva orden";
  const portalUrl = input.portalUrl || buildRamxPortalOrderUrl(input.orderNumber, input.customerEmail);

  const normalizedInput = { ...input, portalUrl };

  await Promise.all([
    transporter.sendMail({
      from,
      to: input.customerEmail,
      subject: isDonation
        ? `RAMX · Gracias por tu apoyo ${input.orderNumber}`
        : `RAMX · Recibimos tu pedido ${input.orderNumber}`,
      html: buildCustomerHtml(normalizedInput),
      text: buildCustomerText(normalizedInput),
    }),
    transporter.sendMail({
      from,
      to: adminEmail,
      subject: `RAMX · ${subjectPrefix} ${input.orderNumber} · ${input.productName}`,
      html: buildAdminHtml(normalizedInput),
      text: buildAdminText(normalizedInput),
      replyTo: input.customerEmail,
    }),
  ]);

  return { sent: true as const };
}

export async function sendRamxPaymentConfirmedEmails(
  input: PaymentConfirmedEmailInput,
) {
  const transporter = getTransporter();
  const from = getFromHeader();

  if (!transporter || !from) {
    console.warn("SMTP no configurado. Se omiten correos de pago RAMX.");
    return { sent: false, reason: "smtp-not-configured" as const };
  }

  const adminEmail =
    process.env.RAMX_ORDERS_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
  const isDonation = input.orderKind === "donation";
  const portalUrl = input.portalUrl || buildRamxPortalOrderUrl(input.orderNumber, input.customerEmail);
  const normalizedInput = { ...input, portalUrl };

  await Promise.all([
    transporter.sendMail({
      from,
      to: input.customerEmail,
      subject: isDonation
        ? `RAMX · Donación confirmada ${input.orderNumber}`
        : `RAMX · Pago confirmado ${input.orderNumber}`,
      html: buildPaymentConfirmedCustomerHtml(normalizedInput),
      text: buildPaymentConfirmedCustomerText(normalizedInput),
    }),
    transporter.sendMail({
      from,
      to: adminEmail,
      subject: `RAMX · Pedido pagado ${input.orderNumber} · ${input.productName}`,
      html: buildPaymentConfirmedAdminHtml(normalizedInput),
      text: buildPaymentConfirmedAdminText(normalizedInput),
      replyTo: input.customerEmail,
    }),
  ]);

  return { sent: true as const };
}

export async function sendRamxOrderStatusUpdateEmail(
  input: OrderStatusUpdateEmailInput,
) {
  const transporter = getTransporter();
  const from = getFromHeader();

  if (!transporter || !from) {
    console.warn("SMTP no configurado. Se omite correo de actualización RAMX.");
    return { sent: false, reason: "smtp-not-configured" as const };
  }

  const portalUrl = input.portalUrl || buildRamxPortalOrderUrl(input.orderNumber, input.customerEmail);
  const normalizedInput = { ...input, portalUrl };
  const copy = getStatusEmailCopy(input.kind, input.orderKind === "donation");

  await transporter.sendMail({
    from,
    to: input.customerEmail,
    subject: `RAMX · ${copy.subject} ${input.orderNumber}`,
    html: buildOrderStatusCustomerHtml(normalizedInput),
    text: buildOrderStatusCustomerText(normalizedInput),
  });

  return { sent: true as const };
}


export async function sendRamxProductAssignedEmail(input: ProductAssignedEmailInput) {
  const transporter = getTransporter();
  const from = getFromHeader();

  if (!transporter || !from) {
    console.warn("SMTP no configurado. Se omite correo de producto asignado RAMX.");
    return { sent: false, reason: "smtp-not-configured" as const };
  }

  await transporter.sendMail({
    from,
    to: input.customerEmail,
    subject: `RAMX · Producto asignado ${input.orderNumber}`,
    html: buildProductAssignedCustomerHtml(input),
    text: buildProductAssignedCustomerText(input),
  });

  return { sent: true as const };
}

function buildCustomerHtml(input: OrderEmailInput) {
  const isDonation = input.orderKind === "donation";

  return baseEmailShell({
    eyebrow: isDonation
      ? "RAMX · Donación recibida"
      : "RAMX · Pedido recibido",
    title: isDonation
      ? `Gracias por apoyar, ${input.customerName}`
      : `Gracias, ${input.customerName}`,
    intro: isDonation
      ? "Gracias por apoyar a RAMX. Tu donación ayuda a fortalecer la red de identidad, localización y acompañamiento para que más mascotas puedan volver a casa."
      : "Recibimos tu pedido RAMX. Si tu pago ya fue realizado, validaremos la operación y te avisaremos cuando pase a preparación.",
    body: `
      ${summaryTable(
        isDonation
          ? [
              ["Número de pedido", input.orderNumber],
              ["Concepto", input.productName],
              ["Monto", formatMxn(input.totalAmount)],
              [
                "Mascota / dedicatoria",
                input.petReference || "No especificada",
              ],
              ["Notas", input.notes || "Sin notas"],
            ]
          : [
              ["Número de pedido", input.orderNumber],
              ["Producto", input.productName],
              ["Cantidad", String(input.quantity)],
              ["Total", formatMxn(input.totalAmount)],
              ["Mascota", input.petReference || "Pendiente de vincular"],
              ["Entrega", deliveryLabel(input.shippingMethod)],
              ["Dirección", input.shippingAddress || "Pendiente de confirmar"],
            ],
      )}

      ${input.paymentUrl ? paymentButton(input.paymentUrl, isDonation) : ""}
      ${input.portalUrl ? portalButton(input.portalUrl) : ""}

      <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
        ${
          input.paymentUrl
            ? isDonation
              ? "Puedes completar tu donación desde el botón anterior. Gracias por ser parte de la red RAMX."
              : "Puedes completar tu pago desde el botón anterior. Al confirmarse, RAMX te avisará por correo y tu pedido avanzará a preparación."
            : isDonation
              ? "Este correo confirma que tu intención de donación fue registrada. El equipo RAMX podrá darte seguimiento."
              : "Este correo confirma que tu pedido fue registrado. El equipo RAMX dará seguimiento a pago, preparación y entrega."
        }
      </p>
    `,
  });
}

function buildAdminHtml(input: OrderEmailInput) {
  const isDonation = input.orderKind === "donation";

  return baseEmailShell({
    eyebrow: isDonation ? "RAMX · Nueva donación" : "RAMX · Nueva orden",
    title: isDonation
      ? `Nueva donación ${input.orderNumber}`
      : `Nueva orden ${input.orderNumber}`,
    intro: isDonation
      ? "Se registró una nueva donación RAMX. Revisa el estado del pago y los datos del donante."
      : "Se registró una nueva solicitud de producto físico. Revisa datos, pago, producción y entrega desde Admin → Pedidos.",
    body: `
      ${summaryTable(
        isDonation
          ? [
              ["Número de pedido", input.orderNumber],
              ["Concepto", input.productName],
              ["Monto", formatMxn(input.totalAmount)],
              ["Nombre del donante", input.customerName],
              ["Correo", input.customerEmail],
              ["WhatsApp / teléfono", input.customerPhone || "No capturado"],
              [
                "Mascota / dedicatoria",
                input.petReference || "No especificada",
              ],
              ["Notas", input.notes || "Sin notas"],
              ["Link de pago", input.paymentUrl || "No generado"],
              ["Portal cliente", input.portalUrl || "No disponible"],
            ]
          : [
              ["Número de pedido", input.orderNumber],
              ["Producto", input.productName],
              ["Precio unitario", formatMxn(input.unitPrice)],
              ["Cantidad", String(input.quantity)],
              ["Total", formatMxn(input.totalAmount)],
              ["Nombre del comprador", input.customerName],
              ["Correo", input.customerEmail],
              ["WhatsApp / teléfono", input.customerPhone || "No capturado"],
              [
                "Mascota",
                input.petReference || "Comprador nuevo / sin vincular",
              ],
              ["Entrega", deliveryLabel(input.shippingMethod)],
              ["Dirección", input.shippingAddress || "Sin dirección capturada"],
              ["Notas", input.notes || "Sin notas"],
              ["Link de pago", input.paymentUrl || "No generado"],
              ["Portal cliente", input.portalUrl || "No disponible"],
            ],
      )}
    `,
  });
}

function buildPaymentConfirmedCustomerHtml(input: PaymentConfirmedEmailInput) {
  const isDonation = input.orderKind === "donation";

  return baseEmailShell({
    eyebrow: isDonation ? "RAMX · Donación confirmada" : "RAMX · Pago confirmado",
    title: isDonation
      ? `Gracias por impulsar RAMX, ${input.customerName}`
      : `Pago recibido, ${input.customerName}`,
    intro: isDonation
      ? "Mercado Pago confirmó tu aportación. Gracias por ayudar a que RAMX pueda llegar a más familias y mascotas."
      : "Mercado Pago confirmó tu preventa. Tu pedido ya quedó asegurado y el equipo RAMX continuará con preparación, asignación y entrega.",
    body: `
      ${summaryTable([
        ["Número de pedido", input.orderNumber],
        ["Concepto", input.productName],
        ["Total pagado", formatMxn(input.totalAmount)],
        ["Pago Mercado Pago", input.paymentId || "Confirmado"],
        ["Estado", input.paymentStatus || "approved"],
        ["Detalle", input.paymentStatusDetail || "Pago aprobado"],
        ["Fecha", input.paidAt ? formatEmailDate(input.paidAt) : "Confirmado por Mercado Pago"],
      ])}

      ${input.portalUrl ? portalButton(input.portalUrl) : ""}

      <p style="margin:22px 0 0;color:#4b5563;font-size:14px;line-height:1.7;text-align:center;">
        ${
          isDonation
            ? "Tu apoyo forma parte del lanzamiento fundador de RAMX. Gracias por creer en una identidad digital más segura para las mascotas."
            : "Te avisaremos cuando tu pedido avance a preparación, asignación de producto o entrega. Gracias por formar parte de la preventa fundadora de RAMX."
        }
      </p>
    `,
  });
}

function buildPaymentConfirmedAdminHtml(input: PaymentConfirmedEmailInput) {
  const isDonation = input.orderKind === "donation";

  return baseEmailShell({
    eyebrow: "RAMX · Pago recibido",
    title: `Pedido pagado ${input.orderNumber}`,
    intro: isDonation
      ? "Mercado Pago confirmó una donación. No requiere producción física, salvo que el equipo RAMX decida dar seguimiento manual."
      : "Mercado Pago confirmó el pago de una orden. El pedido ya puede pasar a preparación operativa.",
    body: `
      ${summaryTable([
        ["Número de pedido", input.orderNumber],
        ["Producto", input.productName],
        ["Total pagado", formatMxn(input.totalAmount)],
        ["Cliente", input.customerName],
        ["Correo", input.customerEmail],
        ["ID de pago", input.paymentId || "No disponible"],
        ["Estado MP", input.paymentStatus || "approved"],
        ["Detalle MP", input.paymentStatusDetail || "Pago aprobado"],
        ["Fecha", input.paidAt ? formatEmailDate(input.paidAt) : "Confirmado por Mercado Pago"],
        ["Portal cliente", input.portalUrl || "No disponible"],
      ])}
    `,
  });
}

function buildOrderStatusCustomerHtml(input: OrderStatusUpdateEmailInput) {
  const copy = getStatusEmailCopy(input.kind, input.orderKind === "donation");
  const rows: [string, string][] = [
    ["Número de pedido", input.orderNumber],
    ["Producto", input.productName],
    ["Total", formatMxn(input.totalAmount)],
    ["Estado", copy.label],
    ["Fecha", input.updatedAt ? formatEmailDate(input.updatedAt) : formatEmailDate(new Date().toISOString())],
  ];

  if (input.shippingCarrier || input.trackingNumber) {
    rows.push(["Paquetería", input.shippingCarrier || "Por confirmar"]);
    rows.push(["Número de guía", input.trackingNumber || "Por confirmar"]);
  }

  return baseEmailShell({
    eyebrow: "RAMX · Actualización de pedido",
    title: copy.title(input.customerName),
    intro: copy.intro,
    body: `
      ${summaryTable(rows)}
      ${input.trackingUrl ? trackingButton(input.trackingUrl) : ""}
      ${input.portalUrl ? portalButton(input.portalUrl) : ""}
      <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
        ${copy.footer}
      </p>
    `,
  });
}


function buildProductAssignedCustomerHtml(input: ProductAssignedEmailInput) {
  return baseEmailShell({
    eyebrow: "RAMX · Producto asignado",
    title: `Tu producto RAMX ya tiene código, ${input.customerName}`,
    intro: "Ya asignamos un código físico a tu pedido. Cuando recibas tu placa, QR o NFC, escanéalo o usa el botón de activación para vincularlo a la mascota correcta.",
    body: `
      ${summaryTable([
        ["Número de pedido", input.orderNumber],
        ["Producto", input.productName],
        ["Código RAMX", input.code],
        ["Fecha", input.assignedAt ? formatEmailDate(input.assignedAt) : formatEmailDate(new Date().toISOString())],
      ])}
      ${activationButton(input.activationUrl)}
      ${input.portalUrl ? portalButton(input.portalUrl) : ""}
      <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
        El código quedará activo cuando lo vincules con una mascota. Desde ese momento, el QR/NFC abrirá su perfil público RAMX.
      </p>
    `,
  });
}

function buildProductAssignedCustomerText(input: ProductAssignedEmailInput) {
  return [
    "RAMX · Producto asignado",
    `Pedido: ${input.orderNumber}`,
    `Producto: ${input.productName}`,
    `Código RAMX: ${input.code}`,
    `Activar producto: ${input.activationUrl}`,
    input.portalUrl ? `Ver pedido: ${input.portalUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCustomerText(input: OrderEmailInput) {
  const isDonation = input.orderKind === "donation";
  const base = isDonation
    ? [
        `Gracias por apoyar, ${input.customerName}.`,
        "",
        "Registramos tu intención de donación para RAMX.",
        `Número de pedido: ${input.orderNumber}`,
        `Monto: ${formatMxn(input.totalAmount)}`,
        `Mascota / dedicatoria: ${input.petReference || "No especificada"}`,
        `Notas: ${input.notes || "Sin notas"}`,
        "",
        input.paymentUrl ? `Link de donación: ${input.paymentUrl}` : "",
        input.portalUrl ? `Ver pedido: ${input.portalUrl}` : "",
      ]
    : [
        `Gracias, ${input.customerName}.`,
        "",
        "Recibimos tu pedido RAMX.",
        `Número de pedido: ${input.orderNumber}`,
        `Producto: ${input.productName}`,
        `Cantidad: ${input.quantity}`,
        `Total: ${formatMxn(input.totalAmount)}`,
        `Mascota: ${input.petReference || "Pendiente de vincular"}`,
        `Entrega: ${deliveryLabel(input.shippingMethod)}`,
        `Dirección: ${input.shippingAddress || "Pendiente de confirmar"}`,
        "",
        input.paymentUrl ? `Link de pago: ${input.paymentUrl}` : "",
        input.portalUrl ? `Ver pedido: ${input.portalUrl}` : "",
      ];

  return base.filter(Boolean).join("\n");
}

function buildAdminText(input: OrderEmailInput) {
  const isDonation = input.orderKind === "donation";

  if (isDonation) {
    return [
      `Nueva donación ${input.orderNumber}`,
      "",
      `Concepto: ${input.productName}`,
      `Monto: ${formatMxn(input.totalAmount)}`,
      "",
      `Donante: ${input.customerName}`,
      `Correo: ${input.customerEmail}`,
      `Teléfono: ${input.customerPhone || "No capturado"}`,
      `Mascota / dedicatoria: ${input.petReference || "No especificada"}`,
      `Notas: ${input.notes || "Sin notas"}`,
      `Link de pago: ${input.paymentUrl || "No generado"}`,
      `Portal cliente: ${input.portalUrl || "No disponible"}`,
    ].join("\n");
  }

  return [
    `Nueva orden ${input.orderNumber}`,
    "",
    `Producto: ${input.productName}`,
    `Precio unitario: ${formatMxn(input.unitPrice)}`,
    `Cantidad: ${input.quantity}`,
    `Total: ${formatMxn(input.totalAmount)}`,
    "",
    `Comprador: ${input.customerName}`,
    `Correo: ${input.customerEmail}`,
    `Teléfono: ${input.customerPhone || "No capturado"}`,
    `Mascota: ${input.petReference || "Comprador nuevo / sin vincular"}`,
    `Entrega: ${deliveryLabel(input.shippingMethod)}`,
    `Dirección: ${input.shippingAddress || "Sin dirección capturada"}`,
    `Notas: ${input.notes || "Sin notas"}`,
    `Link de pago: ${input.paymentUrl || "No generado"}`,
    `Portal cliente: ${input.portalUrl || "No disponible"}`,
  ].join("\n");
}

function buildPaymentConfirmedCustomerText(input: PaymentConfirmedEmailInput) {
  return [
    `RAMX · Pago confirmado`,
    `Pedido: ${input.orderNumber}`,
    `Concepto: ${input.productName}`,
    `Total pagado: ${formatMxn(input.totalAmount)}`,
    input.paymentId ? `Pago Mercado Pago: ${input.paymentId}` : null,
    input.portalUrl ? `Ver pedido: ${input.portalUrl}` : null,
    `Gracias por formar parte de RAMX.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPaymentConfirmedAdminText(input: PaymentConfirmedEmailInput) {
  return [
    `RAMX · Pedido pagado`,
    `Pedido: ${input.orderNumber}`,
    `Producto: ${input.productName}`,
    `Total: ${formatMxn(input.totalAmount)}`,
    `Cliente: ${input.customerName}`,
    `Correo: ${input.customerEmail}`,
    input.paymentId ? `Pago Mercado Pago: ${input.paymentId}` : null,
    input.paymentStatus ? `Estado MP: ${input.paymentStatus}` : null,
    input.paymentStatusDetail ? `Detalle MP: ${input.paymentStatusDetail}` : null,
    input.portalUrl ? `Portal cliente: ${input.portalUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildOrderStatusCustomerText(input: OrderStatusUpdateEmailInput) {
  const copy = getStatusEmailCopy(input.kind, input.orderKind === "donation");

  return [
    `RAMX · ${copy.subject}`,
    `Pedido: ${input.orderNumber}`,
    `Producto: ${input.productName}`,
    `Total: ${formatMxn(input.totalAmount)}`,
    `Estado: ${copy.label}`,
    input.shippingCarrier ? `Paquetería: ${input.shippingCarrier}` : null,
    input.trackingNumber ? `Guía: ${input.trackingNumber}` : null,
    input.trackingUrl ? `Rastreo: ${input.trackingUrl}` : null,
    input.portalUrl ? `Ver pedido: ${input.portalUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function getStatusEmailCopy(kind: RamxOrderStatusEmailKind, isDonation = false) {
  if (isDonation) {
    return {
      subject: "Actualización de donación",
      label: "Actualización RAMX",
      title: (name: string) => `Actualización RAMX, ${name}`,
      intro: "Tenemos una actualización relacionada con tu aportación a RAMX.",
      footer: "Gracias por ayudar a que RAMX pueda llegar a más familias y mascotas.",
    };
  }

  const copy = {
    in_production: {
      subject: "Tu pedido ya está en preparación",
      label: "En preparación",
      title: (name: string) => `Tu pedido ya está en preparación, ${name}`,
      intro: "El equipo RAMX ya está preparando tu producto. Te avisaremos cuando tenga código asignado o guía de entrega.",
      footer: "Gracias por formar parte de la preventa fundadora de RAMX.",
    },
    ready: {
      subject: "Tu producto RAMX fue asignado",
      label: "Producto asignado",
      title: (name: string) => `Tu producto RAMX fue asignado, ${name}`,
      intro: "Tu pedido avanzó a producto asignado/listo. El siguiente paso será entrega, envío o activación según corresponda.",
      footer: "Cuando recibas tu producto, podrás activarlo y vincularlo a la identidad digital de tu mascota.",
    },
    shipped: {
      subject: "Tu pedido RAMX va en camino",
      label: "Enviado / con guía",
      title: (name: string) => `Tu pedido RAMX va en camino, ${name}`,
      intro: "Ya agregamos información de envío a tu pedido. Puedes consultar la guía y darle seguimiento desde el portal RAMX.",
      footer: "Conserva tu número de guía y revisa el portal de cliente para ver el avance actualizado.",
    },
    delivered: {
      subject: "Tu pedido RAMX fue entregado",
      label: "Entregado",
      title: (name: string) => `Tu pedido RAMX fue entregado, ${name}`,
      intro: "Marcamos tu pedido como entregado. Ahora puedes continuar con la activación de tu placa, QR, NFC o producto RAMX.",
      footer: "Escanea tu producto para activar la identidad digital y vincularla a tu mascota.",
    },
    returned: {
      subject: "Actualización de devolución RAMX",
      label: "Devuelto",
      title: (name: string) => `Actualización de devolución, ${name}`,
      intro: "Tu pedido fue marcado con devolución. El equipo RAMX podrá darte seguimiento para resolver el caso.",
      footer: "Si necesitas ayuda, responde este correo o contacta a RAMX.",
    },
  } satisfies Record<RamxOrderStatusEmailKind, {
    subject: string;
    label: string;
    title: (name: string) => string;
    intro: string;
    footer: string;
  }>;

  return copy[kind];
}

function baseEmailShell({
  eyebrow,
  title,
  intro,
  body,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
}) {
  return `
  <div style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;box-shadow:0 24px 60px rgba(15,23,42,.08);overflow:hidden;">
        <div style="background:#f3f4f6;min-height:168px;overflow:hidden;">
          <img src="${escapeHtml(RAMX_BANNER_URL)}" alt="RAMX" style="display:block;width:100%;height:auto;border:0;" />
        </div>

        <div style="padding:30px;">
          <p style="margin:0;color:#f97316;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;text-align:center;">
            ${escapeHtml(eyebrow)}
          </p>

          <h1 style="margin:12px 0 0;color:#111827;font-size:28px;line-height:1.2;text-align:center;">
            ${escapeHtml(title)}
          </h1>

          <p style="margin:18px auto 0;max-width:540px;color:#4b5563;font-size:15px;line-height:1.7;text-align:center;">
            ${escapeHtml(intro)}
          </p>

          ${body}

          <p style="margin:26px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
            RAMX · Registro Animal MX<br />Identidad digital para mascotas.
          </p>
        </div>
      </div>
    </div>
  </div>
  `;
}

function paymentButton(paymentUrl: string, isDonation = false) {
  return `
    <div style="margin:26px 0 0;text-align:center;">
      <a href="${escapeHtml(paymentUrl)}" target="_blank" style="display:inline-block;border-radius:18px;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 22px;">
        ${isDonation ? "Completar donación" : "Pagar con Mercado Pago"}
      </a>
    </div>
  `;
}


function activationButton(activationUrl: string) {
  return `
    <div style="margin:26px 0 0;text-align:center;">
      <a href="${escapeHtml(activationUrl)}" target="_blank" style="display:inline-block;border-radius:18px;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 22px;">
        Activar producto RAMX
      </a>
    </div>
  `;
}

function portalButton(portalUrl: string) {
  return `
    <div style="margin:14px 0 0;text-align:center;">
      <a href="${escapeHtml(portalUrl)}" target="_blank" style="display:inline-block;border-radius:18px;border:1px solid #d1d5db;background:#ffffff;color:#111827;text-decoration:none;font-size:14px;font-weight:800;padding:13px 20px;">
        Ver mi pedido en el portal RAMX
      </a>
    </div>
  `;
}

function trackingButton(trackingUrl: string) {
  return `
    <div style="margin:26px 0 0;text-align:center;">
      <a href="${escapeHtml(trackingUrl)}" target="_blank" style="display:inline-block;border-radius:18px;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 22px;">
        Rastrear envío
      </a>
    </div>
  `;
}

function summaryTable(rows: [string, string][]) {
  return `
    <div style="margin:26px 0 0;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden;background:#ffffff;">
      ${rows
        .map(
          ([label, value]) => `
          <div style="display:flex;gap:14px;border-bottom:1px solid #f3f4f6;padding:14px 16px;">
            <div style="width:42%;color:#6b7280;font-size:13px;font-weight:700;">${escapeHtml(label)}</div>
            <div style="width:58%;color:#111827;font-size:13px;line-height:1.6;">${escapeHtml(value).replaceAll("\n", "<br />")}</div>
          </div>
        `,
        )
        .join("")}
    </div>
  `;
}

function deliveryLabel(value: string) {
  const labels: Record<string, string> = {
    to_confirm: "Confirmar por WhatsApp",
    pickup: "Entrega / recolección local",
    shipping: "Envío a domicilio",
    digital: "Digital / sin envío",
  };

  return labels[value] || "Confirmar por WhatsApp";
}

export function buildRamxPortalOrderUrl(orderNumber: string, customerEmail: string) {
  const baseUrl = getPublicBaseUrl();
  if (!baseUrl || !orderNumber || !customerEmail) return null;

  const params = new URLSearchParams({
    order: orderNumber,
    email: customerEmail.toLowerCase(),
  });

  return `${baseUrl}/portal/ordenes?${params.toString()}`;
}


export function buildRamxActivationUrl(code: string) {
  const baseUrl = getPublicBaseUrl();
  if (!baseUrl || !code) return null;
  return `${baseUrl}/r/${encodeURIComponent(code)}`;
}

function getPublicBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "";

  const value = raw.trim().replace(/\/$/, "");
  if (!value) return null;

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEmailDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

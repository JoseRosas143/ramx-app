"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRamxActiveStoreProduct } from "@/lib/ramx-store-config";
import { sendRamxOrderEmails } from "@/lib/ramx-order-emails";
import {
  createRamxMercadoPagoPreference,
  isMercadoPagoConfigured,
} from "@/lib/ramx-mercado-pago";

export async function createPhysicalProductOrderAction(formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const productType = cleanText(formData.get("product_type"));
  const petId = cleanText(formData.get("pet_id"));
  const petName = cleanText(formData.get("pet_name"));
  const customerName = cleanText(formData.get("customer_name"));
  const customerEmail = normalizeEmail(formData.get("customer_email"));
  const customerPhone = cleanText(formData.get("customer_phone"));
  const shippingMethod =
    cleanText(formData.get("shipping_method")) || "to_confirm";
  const shippingAddress = buildShippingAddress(formData);
  const notes = cleanText(formData.get("notes"));

  if (!productType) {
        redirectToOrderError("invalid_product", productType);
  }

  const product = await getRamxActiveStoreProduct(productType);

  if (!product) {
        redirectToOrderError("invalid_product", productType);
  }

  const isDonation = product.kind === "donation";

  const quantityRaw = Number(formData.get("quantity") || 1);
  const quantity = isDonation
    ? 1
    : Number.isFinite(quantityRaw)
      ? Math.min(Math.max(Math.floor(quantityRaw), 1), 20)
      : 1;

  const donationAmount = parseDonationAmount(formData.get("donation_amount"));
  const unitPrice = isDonation ? donationAmount : product.price;
  const totalAmount = unitPrice * quantity;

  if (!customerName) {
redirectToOrderError("missing_contact_name", productType);
  }

  if (!customerEmail) {
redirectToOrderError("invalid_email", productType);
  }

  if (isDonation && !isMercadoPagoConfigured()) {
redirectToOrderError("mp_required", productType);
  }

  if (isDonation && donationAmount < 10) {
redirectToOrderError("donation_min", productType);
  }

  if (!isDonation && !customerPhone) {
redirectToOrderError("missing_phone", productType);
  }

  if (!isDonation && !shippingAddress) {
redirectToOrderError("missing_address", productType);
  }

  let pet: {
    id: string;
    name: string;
    public_slug: string | null;
    microchip_number: string | null;
    internal_id: string | null;
    primary_tutor_profile_id: string | null;
  } | null = null;

  if (petId) {
    if (!user) {
      throw new Error("Inicia sesión para vincular una mascota registrada.");
    }

    const { data: selectedPet, error: petError } = await admin
      .from("pets")
      .select(
        "id, name, public_slug, microchip_number, internal_id, primary_tutor_profile_id",
      )
      .eq("id", petId)
      .maybeSingle();

    if (
      petError ||
      !selectedPet ||
      selectedPet.primary_tutor_profile_id !== user.id
    ) {
      throw new Error(
        "No tienes permiso para crear una orden para esta mascota.",
      );
    }

    pet = selectedPet;
  }

  const orderNumber = await generateOrderNumber(admin);
  const now = new Date().toISOString();
  const petReference = buildPetReference(pet, petName);
  const storedNotes = buildStoredNotes({ petName, notes, isDonation });

  const { data: order, error: orderError } = await admin
    .from("ramx_orders")
    .insert({
      profile_id: user?.id || null,
      pet_id: pet?.id || null,
      order_number: orderNumber,
      status: "pending",
      payment_status: "unpaid",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      shipping_method: shippingMethod,
      shipping_address: isDonation
        ? "Donación sin producto físico ni envío."
        : shippingAddress,
      notes: storedNotes,
      admin_notes: null,
      total_amount: totalAmount,
      currency: "MXN",
      created_at: now,
      updated_at: now,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || "No se pudo crear la orden.");
  }

  const { error: itemError } = await admin.from("ramx_order_items").insert({
    order_id: order.id,
    product_type: product.type,
    product_name: product.title,
    quantity,
    unit_price: unitPrice,
    created_at: now,
  });

  if (itemError) {
    throw new Error(itemError.message);
  }

  let paymentUrl: string | null = null;

  if (isMercadoPagoConfigured()) {
    try {
      const preference = await createRamxMercadoPagoPreference({
        orderId: order.id,
        orderNumber: order.order_number,
        product,
        quantity,
        unitPrice,
        totalAmount,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: isDonation
          ? "Donación sin producto físico ni envío."
          : shippingAddress,
        petReference,
        notes,
      });

      paymentUrl = preference.initPoint;

      const { error: paymentUpdateError } = await admin
        .from("ramx_orders")
        .update({
          payment_status: "manual_pending",
          payment_provider: "mercado_pago",
          mercado_pago_preference_id: preference.preferenceId,
          mercado_pago_init_point:
            preference.rawInitPoint || preference.initPoint,
          mercado_pago_sandbox_init_point: preference.rawSandboxInitPoint,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (paymentUpdateError) {
        console.error(
          "RAMX Mercado Pago preference saved but order update failed:",
          paymentUpdateError.message,
        );
      }
    } catch (paymentError) {
      console.error("RAMX Mercado Pago preference error:", paymentError);
    }
  }

  try {
    await sendRamxOrderEmails({
      orderNumber: order.order_number,
      orderKind: product.kind,
      productName: product.title,
      unitPrice,
      quantity,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      petName: pet?.name || petName,
      petReference,
      shippingMethod: isDonation ? "digital" : shippingMethod,
      shippingAddress: isDonation
        ? "Donación sin producto físico ni envío."
        : shippingAddress,
      notes,
      paymentUrl,
    });
  } catch (emailError) {
    console.error("RAMX order email error:", emailError);
  }

  if (paymentUrl) {
    redirect(paymentUrl);
  }

  redirect(
    `/tienda/order/success?order=${encodeURIComponent(order.order_number)}`,
  );
}

function redirectToOrderError(error: string, productType?: string | null): never {
  const params = new URLSearchParams({ error });

  if (productType) {
    params.set("product", productType);
  }

  redirect(`/tienda/order?${params.toString()}`);
}

async function generateOrderNumber(
  admin: ReturnType<typeof createAdminClient>,
) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const prefix = `RAMX-${y}${m}${d}`;

  const startOfDay = `${y}-${m}-${d}T00:00:00.000Z`;
  const endOfDay = `${y}-${m}-${d}T23:59:59.999Z`;

  const { count } = await admin
    .from("ramx_orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  const next = String((count || 0) + 1).padStart(4, "0");

  return `${prefix}-${next}`;
}

function buildShippingAddress(formData: FormData) {
  const street = cleanText(formData.get("shipping_street"));
  const neighborhood = cleanText(formData.get("shipping_neighborhood"));
  const state = cleanText(formData.get("shipping_state"));
  const postalCode = cleanText(formData.get("shipping_postal_code"));

  const lines = [
    street ? `Calle y número: ${street}` : null,
    neighborhood ? `Colonia: ${neighborhood}` : null,
    state ? `Estado: ${state}` : null,
    postalCode ? `C.P.: ${postalCode}` : null,
  ].filter(Boolean);

  return lines.length > 0 ? lines.join("\n") : null;
}

function buildPetReference(
  pet: {
    name: string;
    microchip_number: string | null;
    internal_id: string | null;
  } | null,
  petName: string | null,
) {
  if (pet) {
    const id = pet.microchip_number || pet.internal_id || "RAMX";
    return `${pet.name} · ${id}`;
  }

  return petName ? `${petName} · Pendiente de vincular` : null;
}

function buildStoredNotes({
  petName,
  notes,
  isDonation,
}: {
  petName: string | null;
  notes: string | null;
  isDonation: boolean;
}) {
  const lines = [
    isDonation ? "Tipo de solicitud: Donación RAMX" : null,
    petName ? `Mascota sin vincular: ${petName}` : null,
    notes ? `Notas del comprador: ${notes}` : null,
  ].filter(Boolean);

  return lines.length > 0 ? lines.join("\n") : null;
}

function parseDonationAmount(value: FormDataEntryValue | null) {
  const raw = String(value || "")
    .trim()
    .replace(/,/g, "");

  if (!raw) return 0;

  const amount = Number(raw);

  if (!Number.isFinite(amount)) return 0;

  return Math.round(amount * 100) / 100;
}

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = cleanText(value)?.toLowerCase() || null;

  if (!email) return null;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function cleanText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();

  return text.length > 0 ? text : null;
}

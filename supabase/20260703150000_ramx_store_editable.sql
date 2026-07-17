-- RAMX editable store: products, preorder content and dynamic product types.

create table if not exists public.ramx_store_settings (
  id text primary key default 'default',
  preorder_enabled boolean not null default true,
  preorder_badge text not null default 'Preventa fundadora · RAMX',
  preorder_goal integer not null default 200 check (preorder_goal > 0),
  preorder_current_sales integer not null default 0 check (preorder_current_sales >= 0),
  hero_title text not null default 'Ayúdanos a lanzar la primera red inteligente para mascotas RAMX.',
  hero_description text not null default 'Estamos reuniendo las primeras 200 ventas para iniciar producción, activar los códigos QR/NFC y entregar los primeros kits fundadores. Cada compra ayuda a que más mascotas tengan una identidad digital clara, segura y fácil de compartir cuando más se necesita.',
  launch_title text not null default 'Una preventa con propósito.',
  launch_description text not null default 'No estás comprando solo una placa. Estás ayudando a construir una herramienta mexicana para que los tutores puedan compartir datos esenciales, activar alertas, conectar con veterinarias y facilitar el regreso a casa de una mascota extraviada.',
  primary_cta_label text not null default 'Comprar en preventa',
  donation_cta_label text not null default 'Apoyar con donación',
  trust_title text not null default 'Compra segura, activación simple y soporte RAMX.',
  trust_description text not null default 'Paga por Mercado Pago, recibe seguimiento por correo y activa tu producto QR/NFC cuando lo tengas en tus manos.',
  faq_title text not null default 'Preguntas frecuentes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ramx_store_products (
  product_type text primary key,
  kind text not null default 'physical' check (kind in ('physical', 'donation')),
  title text not null,
  short_title text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  price_label text not null default 'Precio por confirmar',
  description text not null,
  image_src text not null,
  includes text[] not null default array[]::text[],
  is_active boolean not null default true,
  sort_order integer not null default 100,
  badge_text text,
  cta_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ramx_store_products_product_type_not_blank check (length(trim(product_type)) > 0),
  constraint ramx_store_products_product_type_format check (product_type ~ '^[a-z0-9_]{2,80}$')
);

create index if not exists ramx_store_products_active_sort_idx
  on public.ramx_store_products (is_active, sort_order, created_at);

insert into public.ramx_store_settings (id)
values ('default')
on conflict (id) do nothing;

insert into public.ramx_store_products (
  product_type,
  kind,
  title,
  short_title,
  price,
  price_label,
  description,
  image_src,
  includes,
  is_active,
  sort_order,
  badge_text,
  cta_label
)
values
  (
    'placa_inteligente_nfc_qr',
    'physical',
    'Placa Inteligente NFC/Qr',
    'Placa NFC/Qr',
    199,
    '$199 MXN',
    'Placa física para collar con lectura QR y NFC, lista para conectar al perfil digital RAMX.',
    'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Productos/Formato%20de%20placa.png',
    array['QR único','NFC integrado','Activación RAMX','Perfil público'],
    true,
    10,
    'Preventa',
    'Comprar en preventa'
  ),
  (
    'combo_identificacion_inteligente',
    'physical',
    'Combo Identificación Inteligente',
    'Combo Identificación',
    475,
    '$475 MXN',
    'Identificación física y digital con placa inteligente y microchip para mayor respaldo.',
    'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Productos/Combo%20II2.png',
    array['Placa NFC/Qr','Microchip','Activación RAMX','Perfil público'],
    true,
    20,
    'Más elegido',
    'Apartar combo'
  ),
  (
    'combo_identidad_inteligente',
    'physical',
    'Combo Identidad Inteligente',
    'Combo Identidad',
    820,
    '$820 MXN',
    'Paquete completo de identidad RAMX con placa, microchip, pasaporte y certificado.',
    'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Productos/Combo%20Identidad%20Inteligente%202.png',
    array['Placa NFC/Qr','Microchip','Pasaporte','Certificado'],
    true,
    30,
    'Completo',
    'Comprar paquete'
  ),
  (
    'donacion_ramx',
    'donation',
    'Donación',
    'Donación RAMX',
    0,
    'Monto libre',
    'Ayúdanos a fortalecer una red de identificación y apoyo para mascotas. Tu donación impulsa mejoras, rescates, difusión y herramientas para que más animales puedan volver a casa.',
    '/images/ramx-donacion.svg',
    array['Monto libre','Pago seguro','Apoyo a la red RAMX','Sin envío'],
    true,
    40,
    'Apoyo voluntario',
    'Donar'
  )
on conflict (product_type) do nothing;

-- Permite productos agregados desde Admin sin tener que tocar SQL cada vez.
alter table if exists public.ramx_order_items
  drop constraint if exists ramx_order_items_product_type_check;

alter table if exists public.ramx_order_items
  drop constraint if exists ramx_order_items_product_type_not_blank;

alter table if exists public.ramx_order_items
  add constraint ramx_order_items_product_type_not_blank
  check (length(trim(product_type)) > 0);

notify pgrst, 'reload schema';

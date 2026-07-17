create table if not exists public.ramx_support_knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'soporte',
  keywords text[] not null default '{}',
  content text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ramx_support_knowledge_active_idx
  on public.ramx_support_knowledge_articles (is_active, sort_order, updated_at desc);

create index if not exists ramx_support_knowledge_category_idx
  on public.ramx_support_knowledge_articles (category);

insert into public.ramx_support_knowledge_articles (slug, title, category, keywords, content, sort_order, is_active)
values
  (
    'reposicion-placa-perdida',
    'Reposición o pérdida de placa RAMX',
    'addons',
    array['placa perdida','perdí mi placa','reposicion','reposición','seguro placa','garantia'],
    'Si el cliente perdió su placa RAMX, primero debe confirmar su número de orden y correo de compra. Si el producto ya estaba activado, el equipo RAMX debe revisar si procede reposición, bloqueo del código anterior o asignación de un nuevo código. No prometer reposición gratuita de forma automática. Recomendar crear ticket cuando el cliente requiera reposición, bloqueo, garantía o cambio de código.',
    20,
    true
  ),
  (
    'activacion-producto-no-aparece',
    'Código QR/NFC no aparece o no activa',
    'activacion',
    array['codigo no funciona','código no funciona','qr no funciona','nfc no funciona','activar placa','producto no aparece'],
    'Si el cliente escanea una placa o entra a /r/[código] y no puede activar, debe revisar que haya iniciado sesión y que use el enlace correcto. Si el sistema indica código inexistente, bloqueado, reemplazado o ya activado, el caso requiere revisión humana. Pedir número de orden, correo de compra y código físico visible en la placa o empaque.',
    30,
    true
  ),
  (
    'cambio-direccion-preventa',
    'Cambio de dirección en preventa',
    'ordenes',
    array['cambiar direccion','cambio de dirección','direccion incorrecta','envio','guia'],
    'Si el cliente necesita cambiar dirección, teléfono o correo de una orden, no hacerlo desde IA. Indicar que cree ticket con número de orden, correo de compra, nueva dirección completa y teléfono. Si el pedido ya tiene guía o está entregado, explicar que el equipo RAMX revisará si aún es posible ajustar el envío.',
    40,
    true
  )
on conflict (slug) do nothing;

notify pgrst, 'reload schema';

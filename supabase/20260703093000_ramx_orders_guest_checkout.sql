-- RAMX tienda: permite solicitudes de compradores nuevos sin cuenta ni mascota vinculada.
-- Ejecutar solo si tu tabla actual tiene profile_id o pet_id como NOT NULL.

alter table if exists public.ramx_orders
  alter column profile_id drop not null;

alter table if exists public.ramx_orders
  alter column pet_id drop not null;

export type RamxStoreProductType =
  | 'placa_inteligente_nfc_qr'
  | 'combo_identificacion_inteligente'
  | 'combo_identidad_inteligente'

export type RamxStoreProduct = {
  type: RamxStoreProductType
  title: string
  shortTitle: string
  price: number
  priceLabel: string
  description: string
  imageSrc: string
  includes: string[]
}

export const RAMX_STORE_PRODUCTS: RamxStoreProduct[] = [
  {
    type: 'placa_inteligente_nfc_qr',
    title: 'Placa Inteligente NFC/Qr',
    shortTitle: 'Placa NFC/Qr',
    price: 199,
    priceLabel: '$199 MXN',
    description:
      'Placa física para collar con lectura QR y NFC, lista para conectar al perfil digital RAMX.',
    imageSrc: 'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Productos/Formato%20de%20placa.png',
    includes: ['QR único', 'NFC integrado', 'Activación RAMX', 'Perfil público'],
  },
  {
    type: 'combo_identificacion_inteligente',
    title: 'Combo Identificación Inteligente',
    shortTitle: 'Combo Identificación',
    price: 475,
    priceLabel: '$475 MXN',
    description:
      'Identificación física y digital con placa inteligente y microchip para mayor respaldo.',
    imageSrc: 'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Productos/Combo%20II2.png',
    includes: ['Placa NFC/Qr', 'Microchip', 'Activación RAMX', 'Perfil público'],
  },
  {
    type: 'combo_identidad_inteligente',
    title: 'Combo Identidad Inteligente',
    shortTitle: 'Combo Identidad',
    price: 820,
    priceLabel: '$820 MXN',
    description:
      'Paquete completo de identidad RAMX con placa, microchip, pasaporte y certificado.',
    imageSrc: 'https://esxkbfyphnthqcxfpkte.supabase.co/storage/v1/object/public/Productos/Combo%20Identidad%20Inteligente%202.png',
    includes: ['Placa NFC/Qr', 'Microchip', 'Pasaporte', 'Certificado'],
  },
]

export const RAMX_STORE_PRODUCT_TYPES = RAMX_STORE_PRODUCTS.map(
  (product) => product.type
)

export const RAMX_STORE_PRODUCT_BY_TYPE = Object.fromEntries(
  RAMX_STORE_PRODUCTS.map((product) => [product.type, product])
) as Record<RamxStoreProductType, RamxStoreProduct>

export function getRamxStoreProduct(type: string | null) {
  if (!type) return null

  return RAMX_STORE_PRODUCTS.find((product) => product.type === type) || null
}

export function formatMxn(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

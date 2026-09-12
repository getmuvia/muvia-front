export const PRODUCT_DIMENSIONS = [
  {
    value: 'width',
    label: 'Ancho',
    description: 'El espacio disponible de lado a lado.',
  },
  {
    value: 'depth',
    label: 'Largo',
    description: 'La distancia desde el frente hasta el fondo.',
  },
  {
    value: 'height',
    label: 'Alto',
    description: 'La distancia vertical disponible.',
  },
] as const;

export type ProductDimension = (typeof PRODUCT_DIMENSIONS)[number]['value'];

export function findProductDimension(value: string | null | undefined) {
  return PRODUCT_DIMENSIONS.find((dimension) => dimension.value === value);
}

export function parseMaxDimensionCm(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 1 && parsedValue <= 10000
    ? parsedValue
    : null;
}

export function formatDimensionCm(value: number): string {
  return new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 1,
  }).format(value);
}

export const FEATURED_CATEGORIES = [
  {
    code: 'CHAIR',
    name: 'Sillas',
    image: '/images/categories/sillas-hogar-2026-09.webp',
  },
  {
    code: 'DESK',
    name: 'Escritorios',
    image: '/images/categories/escritorio-hogar-2026-09.webp',
  },
  {
    code: 'SOFA',
    name: 'Sofás',
    image: '/images/categories/sofa-sala-2026-09.webp',
  },
  {
    code: 'ARMCHAIR',
    name: 'Sillones y butacas',
    image: '/images/categories/sillones-lectura-2026-09.webp',
  },
] as const;

export type FeaturedCategoryCode = (typeof FEATURED_CATEGORIES)[number]['code'];

export function findFeaturedCategory(code: string | null | undefined) {
  const normalizedCode = code?.trim().toUpperCase();
  return FEATURED_CATEGORIES.find((category) => category.code === normalizedCode);
}

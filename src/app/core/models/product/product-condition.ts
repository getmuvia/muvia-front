export enum ProductCondition {
  NEW = 'NEW',
  USED = 'USED',
}

export const PRODUCT_CONDITION_LABELS = {
  [ProductCondition.NEW]: 'catalog.conditionNew',
  [ProductCondition.USED]: 'catalog.conditionUsed',
} as const;

export function isProductCondition(value: unknown): value is ProductCondition {
  return value === ProductCondition.NEW || value === ProductCondition.USED;
}

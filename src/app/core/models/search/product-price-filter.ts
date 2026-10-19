export interface ProductPriceBound {
  amount: number;
  inclusive: boolean;
}

/** Applied server constraints; monetary amounts are never reinterpreted by the UI. */
export interface ProductPriceFilter {
  currencyCode: string;
  minimum?: ProductPriceBound;
  maximum?: ProductPriceBound;
}

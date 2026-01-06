/**
 * Form data model for creating a product.
 * Simplified model for Signal Forms - flat structure for main fields,
 * nested for specifications which are optional.
 */
export interface ProductFormData {
    title: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    // Specifications as simple strings
    weight: string;
    material: string;
    color: string;
    dimensionWidth: number;
    dimensionHeight: number;
    dimensionDepth: number;
    dimensionUnit: string;
}

/**
 * Initial values for the product form
 */
export const INITIAL_PRODUCT_FORM: ProductFormData = {
    title: '',
    description: '',
    price: 0,
    stock: 1,
    categoryId: '',
    weight: '',
    material: '',
    color: '',
    dimensionWidth: 0,
    dimensionHeight: 0,
    dimensionDepth: 0,
    dimensionUnit: 'cm'
};

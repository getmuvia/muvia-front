/**
 * Category from the backend API
 */
export interface Category {
    id: string;
    parentId: string | null;
    name: string;
    description: string;
    imageUrl: string;
    level: number;
}

/**
 * Category from the backend API
 */
export interface Category {
    id: string;
    code: string;
    parentId: string | null;
    name: string;
    description: string;
    imageUrl: string;
    level: number;
    isSelectable: boolean;
}

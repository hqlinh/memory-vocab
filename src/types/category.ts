export interface Category {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type CategoryCreate = Omit<Category, "id" | "createdAt" | "updatedAt">;

import type { Category, CategoryCreate } from "@/types/category";
import { getCategoryCollection } from "./mongodb";

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

export async function getAllCategories(): Promise<Category[]> {
  const col = await getCategoryCollection();
  const list = await col.find({}).sort({ name: 1 }).toArray();
  return list as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const col = await getCategoryCollection();
  const doc = await col.findOne({ id });
  return doc as Category | null;
}

export async function createCategory(data: CategoryCreate): Promise<Category> {
  const now = nowISO();
  const category: Category = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const col = await getCategoryCollection();
  await col.insertOne(category as import("mongodb").WithId<Category>);
  return category;
}

export async function updateCategory(category: Category): Promise<Category> {
  const updated: Category = {
    ...category,
    updatedAt: nowISO(),
  };
  const col = await getCategoryCollection();
  await col.updateOne({ id: category.id }, { $set: updated });
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const col = await getCategoryCollection();
  await col.deleteOne({ id });
}

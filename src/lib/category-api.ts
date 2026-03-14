import type { Category, CategoryCreate } from "@/types/category";

const base = "";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function apiGetCategories(): Promise<Category[]> {
  return getJson<Category[]>(`${base}/api/category`);
}

export async function apiGetCategoryById(id: string): Promise<Category | null> {
  const res = await fetch(`${base}/api/category/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Failed to fetch");
  }
  return res.json() as Promise<Category>;
}

export async function apiCreateCategory(data: CategoryCreate): Promise<Category> {
  return sendJson<Category>(`${base}/api/category`, "POST", data);
}

export async function apiUpdateCategory(category: Category): Promise<Category> {
  return sendJson<Category>(
    `${base}/api/category/${encodeURIComponent(category.id)}`,
    "PUT",
    category
  );
}

export async function apiDeleteCategory(id: string): Promise<void> {
  const res = await fetch(`${base}/api/category/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.ok || res.status === 204) return;
  const err = await res.json().catch(() => ({ error: res.statusText }));
  throw new Error((err as { error?: string }).error ?? "Failed to delete");
}

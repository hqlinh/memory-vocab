import type { VocabEntry, VocabEntryCreate } from "@/types/vocab";

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

export async function apiGetAll(): Promise<VocabEntry[]> {
  return getJson<VocabEntry[]>(`${base}/api/vocab`);
}

export async function apiGetById(id: string): Promise<VocabEntry | null> {
  const res = await fetch(`${base}/api/vocab/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Failed to fetch");
  }
  return res.json() as Promise<VocabEntry>;
}

export async function apiGetEntriesByIds(ids: string[]): Promise<VocabEntry[]> {
  if (ids.length === 0) return [];
  const q = ids.join(",");
  return getJson<VocabEntry[]>(`${base}/api/vocab?ids=${encodeURIComponent(q)}`);
}

export async function apiCreate(data: VocabEntryCreate): Promise<VocabEntry> {
  return sendJson<VocabEntry>(`${base}/api/vocab`, "POST", data);
}

export async function apiUpdate(entry: VocabEntry): Promise<VocabEntry> {
  return sendJson<VocabEntry>(`${base}/api/vocab/${encodeURIComponent(entry.id)}`, "PUT", entry);
}

export async function apiDelete(id: string): Promise<void> {
  const res = await fetch(`${base}/api/vocab/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (res.ok || res.status === 204) return;
  const err = await res.json().catch(() => ({ error: res.statusText }));
  throw new Error((err as { error?: string }).error ?? "Failed to delete");
}

export async function apiGetByDate(date: string): Promise<VocabEntry[]> {
  return getJson<VocabEntry[]>(`${base}/api/vocab?date=${encodeURIComponent(date)}`);
}

export async function apiGetByDateRange(start: string, end: string): Promise<VocabEntry[]> {
  return getJson<VocabEntry[]>(
    `${base}/api/vocab?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  );
}

export async function apiGetByTopic(topic: string): Promise<VocabEntry[]> {
  return getJson<VocabEntry[]>(`${base}/api/vocab?topic=${encodeURIComponent(topic)}`);
}

export async function apiGetByCategoryId(categoryId: string): Promise<VocabEntry[]> {
  return getJson<VocabEntry[]>(
    `${base}/api/vocab?categoryId=${encodeURIComponent(categoryId)}`
  );
}

export async function apiSearchEntriesByWord(
  query: string,
  excludeId?: string
): Promise<{ id: string; word: string }[]> {
  if (!query.trim()) return [];
  const url = new URL(`${base}/api/vocab/search`);
  url.searchParams.set("q", query.trim());
  if (excludeId) url.searchParams.set("excludeId", excludeId);
  return getJson<{ id: string; word: string }[]>(url.toString());
}

export async function apiGetTopics(): Promise<string[]> {
  return getJson<string[]>(`${base}/api/vocab/topics`);
}

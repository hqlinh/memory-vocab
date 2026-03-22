import type { QuickNote, QuickNoteCreate } from "@/types/quick-note";

export async function apiGetQuickNotes(): Promise<QuickNote[]> {
  const res = await fetch("/api/quick-notes");
  if (!res.ok) throw new Error("Failed to fetch quick notes");
  return res.json();
}

export async function apiCreateQuickNote(data: QuickNoteCreate): Promise<QuickNote> {
  const res = await fetch("/api/quick-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create quick note");
  return res.json();
}

export async function apiDeleteQuickNote(id: string): Promise<void> {
  const res = await fetch(`/api/quick-notes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete quick note");
}

import type { QuickNote, QuickNoteCreate } from "@/types/quick-note";
import { getQuickNoteCollection } from "./mongodb";

export async function getAll(): Promise<QuickNote[]> {
  const col = await getQuickNoteCollection();
  const list = await col.find({}).sort({ createdAt: -1 }).toArray();
  return list as QuickNote[];
}

export async function create(data: QuickNoteCreate): Promise<QuickNote> {
  const now = new Date().toISOString();
  const entry: QuickNote = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
  };
  const col = await getQuickNoteCollection();
  await col.insertOne(entry as import("mongodb").WithId<QuickNote>);
  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const col = await getQuickNoteCollection();
  await col.deleteOne({ id });
}

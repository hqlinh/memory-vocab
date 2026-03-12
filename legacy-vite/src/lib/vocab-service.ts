import { db } from "../db";
import type { VocabEntry } from "../types/vocab";

export type VocabEntryCreate = Omit<
  VocabEntry,
  "id" | "createdAt" | "updatedAt"
>;

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

/** Trả về start/end của một ngày (local) dưới dạng ISO string để so sánh với createdAt. */
function getLocalDayBounds(
  date: Date | string
): { start: string; end: string } {
  let d: Date;
  if (typeof date === "string") {
    const [y, m, day] = date.slice(0, 10).split("-").map(Number);
    d = new Date(y, (m || 1) - 1, day || 1);
  } else {
    d = new Date(date);
  }
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getAll(): Promise<VocabEntry[]> {
  return db.vocab.toArray();
}

export async function getById(id: string): Promise<VocabEntry | undefined> {
  return db.vocab.get(id);
}

export async function getEntriesByIds(
  ids: string[]
): Promise<VocabEntry[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const entries = await db.vocab.where("id").anyOf(unique).toArray();
  const byId = new Map(entries.map((e) => [e.id, e]));
  return unique.map((id) => byId.get(id)).filter(Boolean) as VocabEntry[];
}

export async function create(data: VocabEntryCreate): Promise<VocabEntry> {
  const now = nowISO();
  const entry: VocabEntry = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.vocab.add(entry);
  return entry;
}

export async function update(entry: VocabEntry): Promise<VocabEntry> {
  const updated: VocabEntry = {
    ...entry,
    updatedAt: nowISO(),
  };
  await db.vocab.put(updated);
  return updated;
}

export async function deleteEntry(id: string): Promise<void> {
  await db.vocab.delete(id);
}

/** Xóa id khỏi wordFamilyIds/synonymIds/antonymIds của mọi entry khác (sau khi xóa một entry). */
export async function removeIdFromReferences(deletedId: string): Promise<void> {
  const all = await db.vocab.toArray();
  for (const entry of all) {
    let changed = false;
    const wordFamilyIds = entry.wordFamilyIds?.filter((x) => x !== deletedId) ?? [];
    const synonymIds = entry.synonymIds?.filter((x) => x !== deletedId) ?? [];
    const antonymIds = entry.antonymIds?.filter((x) => x !== deletedId) ?? [];
    if (
      (entry.wordFamilyIds?.length ?? 0) !== wordFamilyIds.length ||
      (entry.synonymIds?.length ?? 0) !== synonymIds.length ||
      (entry.antonymIds?.length ?? 0) !== antonymIds.length
    ) {
      changed = true;
    }
    if (changed) {
      await db.vocab.put({
        ...entry,
        wordFamilyIds: wordFamilyIds.length ? wordFamilyIds : undefined,
        synonymIds: synonymIds.length ? synonymIds : undefined,
        antonymIds: antonymIds.length ? antonymIds : undefined,
        updatedAt: nowISO(),
      });
    }
  }
}

/** Lấy entry có createdAt trong đúng ngày (theo giờ local). */
export async function getByDate(
  date: Date | string
): Promise<VocabEntry[]> {
  const { start, end } = getLocalDayBounds(date);
  return db.vocab
    .where("createdAt")
    .between(start, end, true, true)
    .toArray();
}

/** Lấy entry có createdAt trong khoảng [start, end] (start/end theo ngày local). */
export async function getByDateRange(
  startDate: Date | string,
  endDate: Date | string
): Promise<VocabEntry[]> {
  const { start } = getLocalDayBounds(startDate);
  const { end } = getLocalDayBounds(endDate);
  return db.vocab
    .where("createdAt")
    .between(start, end, true, true)
    .toArray();
}

/** Lấy entry có topic khớp chính xác. */
export async function getByTopic(topic: string): Promise<VocabEntry[]> {
  return db.vocab.where("topic").equals(topic).toArray();
}

/** Tìm entry theo word (contains, case-insensitive). Dùng cho autocomplete. excludeId: loại trừ entry (khi sửa). */
export async function searchEntriesByWord(
  query: string,
  excludeId?: string
): Promise<{ id: string; word: string }[]> {
  if (!query.trim()) return [];
  const all = await db.vocab.toArray();
  const q = query.trim().toLowerCase();
  return all
    .filter(
      (e) =>
        e.word.toLowerCase().includes(q) &&
        (excludeId == null || e.id !== excludeId)
    )
    .map((e) => ({ id: e.id, word: e.word }));
}

/** Lấy danh sách topic không trùng (để gợi ý trong form). */
export async function getTopics(): Promise<string[]> {
  const all = await db.vocab.toArray();
  const set = new Set<string>();
  for (const e of all) {
    if (e.topic != null && e.topic.trim() !== "") set.add(e.topic.trim());
  }
  return Array.from(set).sort();
}

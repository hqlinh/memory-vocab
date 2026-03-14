import type { VocabEntry, VocabEntryCreate } from "@/types/vocab";
import { getVocabCollection } from "./mongodb";

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
    d = new Date(y, (m ?? 1) - 1, day ?? 1);
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
  const col = await getVocabCollection();
  const list = await col.find({}).sort({ createdAt: -1 }).toArray();
  return list as VocabEntry[];
}

export async function getById(id: string): Promise<VocabEntry | null> {
  const col = await getVocabCollection();
  const doc = await col.findOne({ id });
  return doc as VocabEntry | null;
}

export async function getEntriesByIds(ids: string[]): Promise<VocabEntry[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const col = await getVocabCollection();
  const entries = await col.find({ id: { $in: unique } }).toArray();
  const byId = new Map((entries as VocabEntry[]).map((e) => [e.id, e]));
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
  const col = await getVocabCollection();
  await col.insertOne(entry as import("mongodb").WithId<VocabEntry>);
  return entry;
}

export async function update(entry: VocabEntry): Promise<VocabEntry> {
  const updated: VocabEntry = {
    ...entry,
    updatedAt: nowISO(),
  };
  const col = await getVocabCollection();
  await col.updateOne(
    { id: entry.id },
    { $set: updated }
  );
  return updated;
}

export async function deleteEntry(id: string): Promise<void> {
  const col = await getVocabCollection();
  await col.deleteOne({ id });
}

/** Xóa id khỏi wordFamilyIds/synonymIds/antonymIds của mọi entry khác (sau khi xóa một entry). */
export async function removeIdFromReferences(deletedId: string): Promise<void> {
  const col = await getVocabCollection();
  await col.updateMany(
    {
      $or: [
        { wordFamilyIds: deletedId },
        { synonymIds: deletedId },
        { antonymIds: deletedId },
      ],
    },
    {
      $pull: {
        wordFamilyIds: deletedId,
        synonymIds: deletedId,
        antonymIds: deletedId,
      },
      $set: { updatedAt: nowISO() },
    }
  );
}

/** Lấy entry có createdAt trong đúng ngày (theo giờ local). */
export async function getByDate(
  date: Date | string
): Promise<VocabEntry[]> {
  const { start, end } = getLocalDayBounds(date);
  const col = await getVocabCollection();
  const list = await col
    .find({ createdAt: { $gte: start, $lte: end } })
    .sort({ createdAt: -1 })
    .toArray();
  return list as VocabEntry[];
}

/** Lấy entry có createdAt trong khoảng [start, end] (start/end theo ngày local). */
export async function getByDateRange(
  startDate: Date | string,
  endDate: Date | string
): Promise<VocabEntry[]> {
  const { start } = getLocalDayBounds(startDate);
  const { end } = getLocalDayBounds(endDate);
  const col = await getVocabCollection();
  const list = await col
    .find({ createdAt: { $gte: start, $lte: end } })
    .sort({ createdAt: -1 })
    .toArray();
  return list as VocabEntry[];
}

/** Lấy entry có topic khớp chính xác. */
export async function getByTopic(topic: string): Promise<VocabEntry[]> {
  const col = await getVocabCollection();
  const list = await col.find({ topic }).sort({ createdAt: -1 }).toArray();
  return list as VocabEntry[];
}

/** Lấy entry theo categoryId. */
export async function getByCategoryId(categoryId: string): Promise<VocabEntry[]> {
  const col = await getVocabCollection();
  const list = await col.find({ categoryId }).sort({ createdAt: -1 }).toArray();
  return list as VocabEntry[];
}

/** Tìm entry theo word (contains, case-insensitive). Dùng cho autocomplete. excludeId: loại trừ entry (khi sửa). */
export async function searchEntriesByWord(
  query: string,
  excludeId?: string
): Promise<{ id: string; word: string }[]> {
  if (!query.trim()) return [];
  const col = await getVocabCollection();
  const filter: import("mongodb").Filter<VocabEntry> = {
    word: { $regex: query.trim(), $options: "i" },
  };
  if (excludeId != null) filter.id = { $ne: excludeId };
  const list = await col
    .find(filter)
    .project({ id: 1, word: 1 })
    .limit(50)
    .toArray();
  return list.map((d) => ({ id: (d as VocabEntry).id, word: (d as VocabEntry).word }));
}

/** Lấy danh sách topic không trùng (để gợi ý trong form). */
export async function getTopics(): Promise<string[]> {
  const col = await getVocabCollection();
  const topics = await col.distinct("topic", { topic: { $exists: true, $ne: "" } });
  return (topics as string[]).filter((t) => t?.trim()).sort();
}

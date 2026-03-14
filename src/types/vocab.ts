export type WordType =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "phrase"
  | "other";

export interface Meaning {
  vietnamese: string;
  examples: string[]; // 1..3
}

/** Nghĩa + ví dụ theo từng loại từ. Mỗi loại (noun, verb, ...) có một mảng Meaning. */
export type SensesByType = Partial<Record<WordType, Meaning[]>>;

export interface VocabEntry {
  id: string;
  word: string;
  phonetic?: string;
  /** Loại từ (được derive từ sensesByType khi có). */
  types: WordType[];
  /** Nghĩa phẳng (được derive từ sensesByType khi có). Giữ cho tương thích. */
  meanings: Meaning[];
  /** Nghĩa + ví dụ theo từng loại từ. Nếu có thì form và hiển thị dùng theo section từng loại. */
  sensesByType?: SensesByType;
  notes?: string;
  imageUrls?: string[];
  topic?: string;
  categoryId?: string;

  wordFamilyIds?: string[];
  synonymIds?: string[];
  antonymIds?: string[];

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type VocabEntryCreate = Omit<
  VocabEntry,
  "id" | "createdAt" | "updatedAt"
>;

export const WORD_TYPE_LABELS: Record<WordType, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  adverb: "Adverb",
  phrase: "Phrase",
  other: "Other",
};

const WORD_TYPES_ORDER: WordType[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "other",
];

/**
 * Trả về senses theo từng loại từ. Nếu entry có sensesByType thì dùng;
 * không thì convert từ types + meanings (dữ liệu cũ: gom hết nghĩa vào loại đầu).
 */
export function getSensesByType(entry: VocabEntry): SensesByType {
  if (entry.sensesByType && Object.keys(entry.sensesByType).length > 0) {
    return entry.sensesByType;
  }
  if (entry.types?.length && entry.meanings?.length) {
    return { [entry.types[0]]: entry.meanings };
  }
  return {};
}

/** Thứ tự hiển thị loại từ (noun, verb, ...). */
export function getOrderedWordTypes(): WordType[] {
  return [...WORD_TYPES_ORDER];
}

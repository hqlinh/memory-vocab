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

export interface VocabEntry {
  id: string;
  word: string;
  phonetic?: string;
  types: WordType[];
  meanings: Meaning[];
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

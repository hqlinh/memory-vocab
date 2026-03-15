import type { VocabEntry } from "@/types/vocab";
import type { Category } from "@/types/category";

const CACHE_MAX_AGE_MS = 2 * 60 * 1000; // 2 phút

let cached: {
  entries: VocabEntry[];
  topics: string[];
  categories: Category[];
  timestamp: number;
} | null = null;

export function getListCache(): {
  entries: VocabEntry[];
  topics: string[];
  categories: Category[];
} | null {
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_MAX_AGE_MS) return null;
  return {
    entries: cached.entries,
    topics: cached.topics,
    categories: cached.categories,
  };
}

export function setListCache(entries: VocabEntry[], topics: string[], categories: Category[]): void {
  cached = {
    entries,
    topics,
    categories,
    timestamp: Date.now(),
  };
}

export function invalidateListCache(): void {
  cached = null;
}

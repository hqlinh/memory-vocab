import Dexie, { type EntityTable } from "dexie";
import type { VocabEntry } from "../types/vocab";

export class MemoryVocabDB extends Dexie {
  vocab!: EntityTable<VocabEntry, "id">;

  constructor() {
    super("MemoryVocabDB");
    this.version(1).stores({
      vocab: "id, createdAt, updatedAt, topic",
    });
  }
}

export const db = new MemoryVocabDB();

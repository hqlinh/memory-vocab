export interface QuickNote {
  id: string;
  word: string;
  meaning: string;
  createdAt: string;
}

export type QuickNoteCreate = Omit<QuickNote, "id" | "createdAt">;

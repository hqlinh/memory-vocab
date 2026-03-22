import { useRouter } from "next/router";
import { VocabForm } from "@/components/VocabForm";
import type { VocabEntry } from "@/types/vocab";

export default function AddVocab() {
  const router = useRouter();
  const { word, meaning, quickNoteId } = router.query;

  if (!router.isReady) return null;

  let initialEntry: VocabEntry | null = null;
  if (word || meaning) {
    initialEntry = {
      id: "temp-from-quick-note",
      word: (word as string) || "",
      phonetic: "",
      types: ["noun"],
      meanings: [{ vietnamese: (meaning as string) || "", examples: [""] }],
      sensesByType: {
        noun: [{ vietnamese: (meaning as string) || "", examples: [""] }]
      },
      createdAt: "",
      updatedAt: "",
    } as VocabEntry;
  }

  return (
    <VocabForm 
      mode="add" 
      initialEntry={initialEntry} 
      quickNoteId={quickNoteId as string} 
    />
  );
}

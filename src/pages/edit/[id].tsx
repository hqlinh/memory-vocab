import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiGetById } from "@/lib/vocab-api";
import type { VocabEntry } from "@/types/vocab";
import { Button } from "@/components/ui/button";
import { VocabForm } from "@/components/VocabForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function EditVocab() {
  const router = useRouter();
  const { id } = router.query;
  const idStr = typeof id === "string" ? id : undefined;
  const [entry, setEntry] = useState<VocabEntry | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!idStr) {
      router.replace("/list");
      return;
    }
    setLoadError(null);
    apiGetById(idStr)
      .then((e) => {
        if (e == null) {
          router.replace("/list");
          return;
        }
        setEntry(e);
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "Không tải được từ vựng.");
        setEntry(null);
      });
  }, [idStr, router.isReady, router]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <p className="text-destructive">{loadError}</p>
        <Button variant="outline" onClick={() => router.push("/list")}>
          Về danh sách
        </Button>
      </div>
    );
  }

  if (entry === undefined) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
        role="status"
        aria-label="Đang tải trang sửa từ"
      >
        <LoadingSpinner size={32} />
        <span>Đang tải…</span>
      </div>
    );
  }

  return <VocabForm mode="edit" initialEntry={entry} />;
}

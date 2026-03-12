import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getById } from "@/lib/vocab-service";
import type { VocabEntry } from "@/types/vocab";
import { VocabForm } from "@/components/VocabForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function EditVocab() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<VocabEntry | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      navigate("/list", { replace: true });
      return;
    }
    getById(id).then((e) => {
      if (e == null) {
        navigate("/list", { replace: true });
        return;
      }
      setEntry(e);
    });
  }, [id, navigate]);

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

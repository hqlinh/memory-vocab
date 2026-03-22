import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { toast } from "sonner";
import { StickyNote, Plus, Trash2, ArrowRight } from "lucide-react";
import { apiGetQuickNotes, apiCreateQuickNote, apiDeleteQuickNote } from "@/lib/quick-note-api";
import type { QuickNote } from "@/types/quick-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QuickNotesPage() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await apiGetQuickNotes();
      setNotes(data);
    } catch {
      toast.error("Không thể tải danh sách note nhanh.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      toast.error("Vui lòng nhập đầy đủ từ và nghĩa.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiCreateQuickNote({
        word: word.trim(),
        meaning: meaning.trim(),
      });
      toast.success("Đã thêm note nhanh.");
      setWord("");
      setMeaning("");
      fetchNotes();
    } catch {
      toast.error("Không thể thêm note nhanh.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
    try {
      await apiDeleteQuickNote(id);
      toast.success("Đã xóa note nhanh.");
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Không thể xóa note nhanh.");
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <>
      <Head>
        <title>Note nhanh - Memory Vocab</title>
      </Head>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
          <StickyNote className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Note nhanh</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lưu nhanh từ mới bắt gặp để thêm vào danh sách từ vựng sau.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card shadow-sm border border-border/60 p-6 sm:p-8 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1 w-full">
            <Label htmlFor="word" className="text-sm font-medium">Từ vựng</Label>
            <Input
              id="word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Nhập từ tiếng Anh..."
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2 flex-1 w-full">
            <Label htmlFor="meaning" className="text-sm font-medium">Nghĩa tiếng Việt</Label>
            <Input
              id="meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Nhập nghĩa..."
              className="h-11"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-6 rounded-lg shadow-md shadow-primary/25 shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <Plus className="size-4 mr-2" />
            Thêm
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          Danh sách từ đã note
          <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {notes.length}
          </span>
        </h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Đang tải...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-border flex flex-col items-center justify-center bg-muted/20">
            <StickyNote className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Chưa có từ vựng nào trong note nhanh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-primary">{note.word}</h3>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-3">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-foreground text-sm mb-4">{note.meaning}</p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 mt-auto border-t border-border/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    onClick={(e) => handleDelete(note.id, e)}
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Xóa
                  </Button>
                  <Link
                    href={`/add?word=${encodeURIComponent(note.word)}&meaning=${encodeURIComponent(note.meaning)}&quickNoteId=${note.id}`}
                    className="inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary/10 text-primary hover:bg-primary/20 h-8 rounded-md px-3"
                  >
                    Thêm vào từ vựng
                    <ArrowRight className="size-3 ml-1.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

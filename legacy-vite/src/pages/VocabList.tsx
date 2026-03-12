import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAll,
  getById,
  getEntriesByIds,
  deleteEntry,
  removeIdFromReferences,
  getTopics,
} from "@/lib/vocab-service";
import type { VocabEntry, WordType } from "@/types/vocab";
import { WORD_TYPE_LABELS } from "@/types/vocab";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type SortKey = "createdAt" | "updatedAt" | "word";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt", label: "Ngày tạo (mới nhất)" },
  { value: "updatedAt", label: "Ngày sửa (mới nhất)" },
  { value: "word", label: "Từ A → Z" },
];

const WORD_TYPES: WordType[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "other",
];

export default function VocabList() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [filterTypes, setFilterTypes] = useState<WordType[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; word: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allEntries, topicList] = await Promise.all([
        getAll(),
        getTopics(),
      ]);
      setEntries(allEntries);
      setTopics(topicList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...entries];
    if (filterTopic) {
      list = list.filter((e) => (e.topic ?? "").trim() === filterTopic);
    }
    if (filterTypes.length > 0) {
      list = list.filter((e) =>
        e.types.some((t) => filterTypes.includes(t))
      );
    }
    if (sortBy === "createdAt") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sortBy === "updatedAt") {
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } else {
      list.sort((a, b) => a.word.localeCompare(b.word, "en"));
    }
    return list;
  }, [entries, filterTopic, filterTypes, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      await removeIdFromReferences(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setDetailId((prev) => (prev === id ? null : prev));
      setDeleteConfirm(null);
      toast.success("Đã xóa từ vựng.");
    } catch {
      toast.error("Không thể xóa.");
    }
  };

  const toggleFilterType = (t: WordType) => {
    setFilterTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Danh sách từ vựng</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
                <div className="flex flex-wrap gap-1 mt-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Danh sách từ vựng</h1>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Sắp xếp</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy((v ?? sortBy) as SortKey)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Chủ đề</Label>
          <Select value={filterTopic || undefined} onValueChange={(v) => setFilterTopic(v ?? "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Loại từ</Label>
          <div className="flex flex-wrap gap-2">
            {WORD_TYPES.map((t) => (
              <label
                key={t}
                className="flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={filterTypes.includes(t)}
                  onCheckedChange={() => toggleFilterType(t)}
                />
                <span>{WORD_TYPE_LABELS[t]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <p className="text-muted-foreground py-8">
          {entries.length === 0
            ? "Chưa có từ vựng nào. Thêm từ mới từ menu."
            : "Không có từ nào khớp bộ lọc."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredAndSorted.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setDetailId(entry.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{entry.word}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {entry.meanings.length} nghĩa
                  </span>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {entry.types.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {WORD_TYPE_LABELS[t]}
                    </Badge>
                  ))}
                  {entry.topic?.trim() && (
                    <Badge variant="outline" className="text-xs">
                      {entry.topic}
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <DetailModal
        entryId={detailId}
        onClose={() => setDetailId(null)}
        onOpenId={setDetailId}
        onEdit={(id) => navigate(`/edit/${id}`)}
        onDeleteRequest={(id, word) => setDeleteConfirm({ id, word })}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent showCloseButton className="sm:max-w-sm" aria-describedby="delete-confirm-desc">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p id="delete-confirm-desc" className="text-sm text-muted-foreground">
            {deleteConfirm
              ? `Bạn có chắc muốn xóa từ "${deleteConfirm.word}"? Thao tác không thể hoàn tác.`
              : "Bạn có chắc muốn xóa từ vựng này? Thao tác không thể hoàn tác."}
          </p>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm) {
                  handleDelete(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailModal({
  entryId,
  onClose,
  onOpenId,
  onEdit,
  onDeleteRequest,
}: {
  entryId: string | null;
  onClose: () => void;
  onOpenId: (id: string) => void;
  onEdit: (id: string) => void;
  onDeleteRequest: (id: string, word: string) => void;
}) {
  const [entry, setEntry] = useState<VocabEntry | null>(null);
  const [related, setRelated] = useState<{ word: string; id: string }[]>([]);

  useEffect(() => {
    if (!entryId) {
      setEntry(null);
      setRelated([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const e = await getById(entryId);
      if (cancelled || !e) {
        if (!cancelled) setEntry(null);
        return;
      }
      setEntry(e);
      const ids = [
        ...(e.wordFamilyIds ?? []),
        ...(e.synonymIds ?? []),
        ...(e.antonymIds ?? []),
      ];
      if (ids.length === 0) {
        setRelated([]);
        return;
      }
      const entries = await getEntriesByIds(ids);
      setRelated(entries.map((x) => ({ id: x.id, word: x.word })));
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  if (!entryId) return null;

  return (
    <Dialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" showCloseButton>
        <DialogHeader>
          <DialogTitle className="pr-8">{entry?.word ?? "…"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[60vh] -mx-2 px-2">
          {!entry ? (
            <div className="space-y-4 py-2" aria-busy="true" aria-label="Đang tải chi tiết">
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[75%]" />
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-1">
                {entry.types.map((t) => (
                  <Badge key={t} variant="secondary">
                    {WORD_TYPE_LABELS[t]}
                  </Badge>
                ))}
                {entry.topic?.trim() && (
                  <Badge variant="outline">{entry.topic}</Badge>
                )}
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-1">Nghĩa</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {entry.meanings.map((m, i) => (
                    <li key={i}>
                      <span className="text-foreground">{m.vietnamese}</span>
                      {m.examples.length > 0 && (
                        <ul className="mt-1 ml-4 list-none space-y-0.5 text-muted-foreground">
                          {m.examples.map((ex, j) => (
                            <li key={j}>• {ex}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {entry.notes?.trim() && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Ghi chú</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {entry.notes}
                  </p>
                </div>
              )}

              {entry.imageUrls && entry.imageUrls.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-1 flex items-center gap-1">
                    <ImageIcon className="size-4" />
                    Ảnh
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="rounded-lg border object-cover size-20"
                      />
                    ))}
                  </div>
                </div>
              )}

              {related.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">
                    Word family / Đồng nghĩa / Trái nghĩa
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {related.map(({ id, word }) => (
                      <Button
                        key={id}
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary underline"
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          onOpenId(id);
                        }}
                      >
                        {word}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        {entry && (
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => onEdit(entry.id)}>
              <Pencil className="size-4 mr-1" />
              Sửa
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onClose();
                onDeleteRequest(entry.id, entry.word);
              }}
            >
              <Trash2 className="size-4 mr-1" />
              Xóa
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

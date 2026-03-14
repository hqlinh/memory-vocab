import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  apiGetAll,
  apiGetById,
  apiGetEntriesByIds,
  apiDelete,
  apiGetTopics,
} from "@/lib/vocab-api";
import { apiGetCategories } from "@/lib/category-api";
import type { Category } from "@/types/category";
import type { VocabEntry, WordType } from "@/types/vocab";
import { WORD_TYPE_LABELS } from "@/types/vocab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Pencil, Trash2, Image as ImageIcon, List } from "lucide-react";
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
  const router = useRouter();
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterTypes, setFilterTypes] = useState<WordType[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; word: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [allEntries, topicList, categoryList] = await Promise.all([
        apiGetAll(),
        apiGetTopics(),
        apiGetCategories(),
      ]);
      setEntries(allEntries);
      setTopics(topicList);
      setCategories(categoryList);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được danh sách.");
      setEntries([]);
      setTopics([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const id = router.query.categoryId;
    if (typeof id === "string" && id) setFilterCategoryId(id);
  }, [router.query.categoryId]);

  const categoryById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filteredAndSorted = useMemo(() => {
    let list = [...entries];
    if (filterTopic) {
      list = list.filter((e) => (e.topic ?? "").trim() === filterTopic);
    }
    if (filterCategoryId) {
      list = list.filter((e) => (e.categoryId ?? "") === filterCategoryId);
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
  }, [entries, filterTopic, filterCategoryId, filterTypes, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(id);
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

  if (loading && entries.length === 0 && !loadError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <List className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách từ vựng</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden rounded-xl">
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

  if (loadError && entries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <List className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách từ vựng</h1>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <p className="text-destructive mb-2">{loadError}</p>
            <Button onClick={() => loadData()} disabled={loading}>
              {loading ? "Đang tải…" : "Thử lại"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
          <List className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách từ vựng</h1>
          <p className="text-sm text-muted-foreground">{entries.length} từ đã lưu</p>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Sắp xếp</Label>
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
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Chủ đề</Label>
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
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Category</Label>
            <Select value={filterCategoryId || undefined} onValueChange={(v) => setFilterCategoryId(v ?? "")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Loại từ</Label>
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
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {entries.length === 0
              ? "Chưa có từ vựng nào. Thêm từ mới từ menu."
              : "Không có từ nào khớp bộ lọc."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredAndSorted.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer rounded-xl border-border/60 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
              onClick={() => setDetailId(entry.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="font-semibold">{entry.word}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {entry.meanings.length} nghĩa
                  </span>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {entry.types.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs rounded-full bg-primary/10 text-primary border-0">
                      {WORD_TYPE_LABELS[t]}
                    </Badge>
                  ))}
                  {entry.categoryId && categoryById.get(entry.categoryId) && (
                    <Badge variant="outline" className="text-xs rounded-full">
                      {categoryById.get(entry.categoryId)}
                    </Badge>
                  )}
                  {entry.topic?.trim() && (
                    <Badge variant="outline" className="text-xs rounded-full">
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
        onEdit={(id) => router.push(`/edit/${id}`)}
        onDeleteRequest={(id, word) => setDeleteConfirm({ id, word })}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent showCloseButton className="sm:max-w-sm rounded-xl" aria-describedby="delete-confirm-desc">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p id="delete-confirm-desc" className="text-sm text-muted-foreground">
            {deleteConfirm
              ? `Bạn có chắc muốn xóa từ "${deleteConfirm.word}"? Thao tác không thể hoàn tác.`
              : "Bạn có chắc muốn xóa từ vựng này? Thao tác không thể hoàn tác."}
          </p>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg">
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg"
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
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) {
      setEntry(null);
      setRelated([]);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetailError(null);
    (async () => {
      try {
        const e = await apiGetById(entryId);
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
        const entries = await apiGetEntriesByIds(ids);
        if (!cancelled) setRelated(entries.map((x) => ({ id: x.id, word: x.word })));
      } catch (err) {
        if (!cancelled) {
          setEntry(null);
          setRelated([]);
          setDetailError(err instanceof Error ? err.message : "Không tải được chi tiết.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  if (!entryId) return null;

  return (
    <Dialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col rounded-xl" showCloseButton>
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl">{entry?.word ?? "…"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[60vh] -mx-2 px-2">
          {detailError ? (
            <div className="space-y-4 py-2">
              <p className="text-destructive text-sm">{detailError}</p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          ) : !entry ? (
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
              <div className="flex flex-wrap gap-1.5">
                {entry.types.map((t) => (
                  <Badge key={t} className="rounded-full bg-primary/10 text-primary border-0">
                    {WORD_TYPE_LABELS[t]}
                  </Badge>
                ))}
                {entry.topic?.trim() && (
                  <Badge variant="outline" className="rounded-full">{entry.topic}</Badge>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1.5">Nghĩa</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {entry.meanings.map((m, i) => (
                    <li key={i}>
                      <span className="text-foreground font-medium">{m.vietnamese}</span>
                      {m.examples.length > 0 && (
                        <ul className="mt-1 ml-4 list-none space-y-0.5 text-muted-foreground">
                          {m.examples.map((ex, j) => (
                            <li key={j} className="text-muted-foreground/80">• {ex}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {entry.notes?.trim() && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Ghi chú</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {entry.notes}
                  </p>
                </div>
              )}

              {entry.imageUrls && entry.imageUrls.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="size-4 text-primary" />
                    Ảnh
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="rounded-xl border object-cover size-20"
                      />
                    ))}
                  </div>
                </div>
              )}

              {related.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Từ liên quan
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
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
            <Button variant="outline" onClick={() => onEdit(entry.id)} className="rounded-lg">
              <Pencil className="size-4 mr-1" />
              Sửa
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg"
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

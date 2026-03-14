import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "sonner";
import type { VocabEntry, WordType, Meaning, SensesByType } from "@/types/vocab";
import { WORD_TYPE_LABELS, getSensesByType, getOrderedWordTypes } from "@/types/vocab";
import { apiCreate, apiUpdate, apiGetTopics, apiSearchEntriesByWord } from "@/lib/vocab-api";
import { apiGetCategories, apiCreateCategory } from "@/lib/category-api";
import type { Category } from "@/types/category";
import type { VocabEntryCreate } from "@/types/vocab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MeaningBlock } from "@/components/MeaningBlock";
import { ImageUpload } from "@/components/ImageUpload";
import { EntryIdSelect } from "@/components/EntryIdSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  BookOpen,
  Type,
  Tag,
  Languages,
  StickyNote,
  Image as ImageIcon,
  Link2,
  Save,
  Volume2,
  FolderTree,
  FolderPlus,
} from "lucide-react";

const WORD_TYPES: WordType[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "other",
];

const defaultMeaning: Meaning = { vietnamese: "", examples: [""] };

export type VocabFormMode = "add" | "edit";

export interface VocabFormProps {
  mode: VocabFormMode;
  initialEntry?: VocabEntry | null;
}

function normalizeMeaning(m: Meaning): Meaning {
  const examples = m.examples
    .map((e) => e.trim())
    .filter(Boolean)
    .slice(0, 3);
  return {
    vietnamese: m.vietnamese.trim(),
    examples: examples.length ? examples : [""],
  };
}

function validateSensesByType(word: string, sensesByType: SensesByType): string | null {
  if (!word.trim()) return "Vui lòng nhập từ.";
  const types = Object.keys(sensesByType) as WordType[];
  if (types.length === 0) return "Vui lòng chọn ít nhất một loại từ.";
  for (const t of types) {
    const meanings = sensesByType[t] ?? [];
    if (meanings.length === 0) return `${WORD_TYPE_LABELS[t]}: cần ít nhất một nghĩa.`;
    for (let i = 0; i < meanings.length; i++) {
      const m = meanings[i];
      if (!m.vietnamese.trim())
        return `${WORD_TYPE_LABELS[t]} — Nghĩa ${i + 1}: vui lòng nhập nghĩa tiếng Việt.`;
      const validExamples = m.examples.map((e) => e.trim()).filter(Boolean);
      if (validExamples.length === 0)
        return `${WORD_TYPE_LABELS[t]} — Nghĩa ${i + 1}: cần ít nhất một ví dụ.`;
      if (validExamples.length > 3)
        return `${WORD_TYPE_LABELS[t]} — Nghĩa ${i + 1}: tối đa 3 ví dụ.`;
    }
  }
  return null;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-6 rounded-full bg-primary" />
      <h2 className="text-base font-semibold text-foreground">{children}</h2>
    </div>
  );
}

function FieldLabel({
  icon: Icon,
  children,
  required,
  htmlFor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Icon className="size-4 text-primary" />
      <span>
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
    </Label>
  );
}

function initialSensesFromEntry(entry: VocabEntry | null | undefined): SensesByType {
  if (!entry) return {};
  const senses = getSensesByType(entry);
  if (Object.keys(senses).length > 0) return senses;
  return {};
}

export function VocabForm({ mode, initialEntry }: VocabFormProps) {
  const router = useRouter();
  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [sensesByType, setSensesByType] = useState<SensesByType>(() =>
    initialSensesFromEntry(initialEntry ?? null)
  );
  const [notes, setNotes] = useState("");
  const [topic, setTopic] = useState("");
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [wordFamilyIds, setWordFamilyIds] = useState<string[]>([]);
  const [synonymIds, setSynonymIds] = useState<string[]>([]);
  const [antonymIds, setAntonymIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [duplicateEntry, setDuplicateEntry] = useState<{ id: string; word: string } | null>(null);
  const checkDuplicateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkDuplicate = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setDuplicateEntry(null);
        return;
      }
      const excludeId = mode === "edit" ? initialEntry?.id : undefined;
      try {
        const list = await apiSearchEntriesByWord(trimmed, excludeId);
        const exact = list.find(
          (e) => e.word.trim().toLowerCase() === trimmed.toLowerCase()
        );
        setDuplicateEntry(exact ?? null);
      } catch {
        setDuplicateEntry(null);
      }
    },
    [mode, initialEntry?.id]
  );

  useEffect(() => {
    if (!word.trim()) {
      setDuplicateEntry(null);
      return;
    }
    if (checkDuplicateTimeoutRef.current) clearTimeout(checkDuplicateTimeoutRef.current);
    checkDuplicateTimeoutRef.current = setTimeout(() => {
      checkDuplicate(word);
      checkDuplicateTimeoutRef.current = null;
    }, 400);
    return () => {
      if (checkDuplicateTimeoutRef.current) clearTimeout(checkDuplicateTimeoutRef.current);
    };
  }, [word, checkDuplicate]);

  useEffect(() => {
    apiGetTopics()
      .then(setTopicSuggestions)
      .catch(() => setTopicSuggestions([]));
  }, []);

  useEffect(() => {
    apiGetCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (initialEntry) {
      setWord(initialEntry.word);
      setPhonetic(initialEntry.phonetic ?? "");
      setSensesByType(initialSensesFromEntry(initialEntry));
      setNotes(initialEntry.notes ?? "");
      setTopic(initialEntry.topic ?? "");
      setCategoryId(initialEntry.categoryId ?? "");
      setImageUrls(initialEntry.imageUrls ?? []);
      setWordFamilyIds(initialEntry.wordFamilyIds ?? []);
      setSynonymIds(initialEntry.synonymIds ?? []);
      setAntonymIds(initialEntry.antonymIds ?? []);
    }
  }, [initialEntry?.id]);

  const toggleType = (t: WordType) => {
    setSensesByType((prev) => {
      const next = { ...prev };
      if (next[t]) {
        delete next[t];
        return next;
      }
      next[t] = [{ ...defaultMeaning }];
      return next;
    });
  };

  const setMeaningForType = (wordType: WordType, index: number, value: Meaning) => {
    setSensesByType((prev) => {
      const list = [...(prev[wordType] ?? [])];
      list[index] = value;
      return { ...prev, [wordType]: list };
    });
  };

  const addMeaningForType = (wordType: WordType) => {
    setSensesByType((prev) => ({
      ...prev,
      [wordType]: [...(prev[wordType] ?? []), { ...defaultMeaning }],
    }));
  };

  const removeMeaningForType = (wordType: WordType, index: number) => {
    setSensesByType((prev) => {
      const list = prev[wordType] ?? [];
      if (list.length <= 1) return prev;
      return { ...prev, [wordType]: list.filter((_, i) => i !== index) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateSensesByType(word, sensesByType);
    if (err) {
      toast.error(err);
      return;
    }

    const normalized: SensesByType = {};
    for (const t of getOrderedWordTypes()) {
      const list = sensesByType[t] ?? [];
      const normalizedList = list
        .map(normalizeMeaning)
        .filter((m) => m.vietnamese && m.examples.some(Boolean));
      if (normalizedList.length > 0) {
        normalized[t] = normalizedList.map((m) => ({
          vietnamese: m.vietnamese,
          examples: m.examples.slice(0, 3),
        }));
      }
    }
    if (Object.keys(normalized).length === 0) {
      toast.error("Cần ít nhất một nghĩa có nội dung.");
      return;
    }
    const finalTypes = Object.keys(normalized) as WordType[];
    const finalMeanings = Object.values(normalized).flat();

    if (mode === "add" && duplicateEntry) {
      toast.error("Từ này đã tồn tại. Vui lòng sửa từ hiện có hoặc nhập từ khác.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "add") {
        const data: VocabEntryCreate = {
          word: word.trim(),
          phonetic: phonetic.trim() || undefined,
          types: finalTypes,
          meanings: finalMeanings,
          sensesByType: normalized,
          notes: notes.trim() || undefined,
          topic: topic.trim() || undefined,
          categoryId: categoryId.trim() || undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          wordFamilyIds: wordFamilyIds.length ? wordFamilyIds : undefined,
          synonymIds: synonymIds.length ? synonymIds : undefined,
          antonymIds: antonymIds.length ? antonymIds : undefined,
        };
        await apiCreate(data);
        toast.success("Đã thêm từ.");
      } else if (initialEntry) {
        const updated: VocabEntry = {
          ...initialEntry,
          word: word.trim(),
          phonetic: phonetic.trim() || undefined,
          types: finalTypes,
          meanings: finalMeanings,
          sensesByType: normalized,
          notes: notes.trim() || undefined,
          topic: topic.trim() || undefined,
          categoryId: categoryId.trim() || undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          wordFamilyIds: wordFamilyIds.length ? wordFamilyIds : undefined,
          synonymIds: synonymIds.length ? synonymIds : undefined,
          antonymIds: antonymIds.length ? antonymIds : undefined,
        };
        await apiUpdate(updated);
        toast.success("Đã cập nhật từ.");
      }
      router.push("/list");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Có lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "add" ? "Thêm từ vựng mới" : "Sửa từ vựng";
  const subtitle = mode === "add"
    ? "Điền đầy đủ thông tin để ghi nhớ từ vựng hiệu quả hơn"
    : "Chỉnh sửa thông tin từ vựng";

  return (
    <form onSubmit={handleSubmit} aria-busy={saving} aria-disabled={saving}>
      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
          <BookOpen className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card shadow-sm border border-border/60 overflow-hidden">
        {/* Section: Thông tin cơ bản */}
        <div className="p-6 sm:p-8">
          <SectionHeader>Thông tin cơ bản</SectionHeader>

          <div className="space-y-5">
            {/* Từ vựng + Phiên âm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <FieldLabel icon={Type} required htmlFor="word">Từ vựng</FieldLabel>
                <Input
                  id="word"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  onBlur={() => word.trim() && checkDuplicate(word)}
                  placeholder="Ví dụ: Excellent"
                  required
                  className={duplicateEntry ? "border-destructive" : ""}
                  aria-invalid={!!duplicateEntry}
                />
                {duplicateEntry && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    Từ này đã tồn tại.
                    <Link
                      href={`/edit/${duplicateEntry.id}`}
                      className="underline font-medium hover:no-underline"
                    >
                      Mở bản ghi hiện có
                    </Link>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Volume2} htmlFor="phonetic">Phiên âm</FieldLabel>
                <Input
                  id="phonetic"
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                  placeholder="Ví dụ: /ˈeksələnt/"
                />
              </div>
            </div>

            {/* Loại từ: chọn loại nào thì có section nghĩa riêng cho loại đó */}
            <div className="space-y-2">
              <FieldLabel icon={Tag} required>Loại từ</FieldLabel>
              <p className="text-xs text-muted-foreground">
                Chọn từng loại (danh từ, động từ, …); mỗi loại có một khối để ghi nghĩa và ví dụ.
              </p>
              <div className="flex flex-wrap gap-4" role="group" aria-label="Chọn loại từ">
                {WORD_TYPES.map((t) => (
                  <label
                    key={t}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={!!sensesByType[t]?.length}
                      onCheckedChange={() => toggleType(t)}
                      aria-label={WORD_TYPE_LABELS[t]}
                    />
                    <span className="text-sm font-medium">{WORD_TYPE_LABELS[t]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nghĩa + ví dụ theo từng loại từ */}
            <div className="space-y-6">
              <FieldLabel icon={Languages} required>Nghĩa và ví dụ theo loại từ</FieldLabel>
              {getOrderedWordTypes()
                .filter((t) => sensesByType[t]?.length)
                .map((wordType) => {
                  const meanings = sensesByType[wordType] ?? [];
                  return (
                    <div
                      key={wordType}
                      className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">
                          {WORD_TYPE_LABELS[wordType]}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addMeaningForType(wordType)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Plus className="size-4 mr-1" />
                          Thêm nghĩa
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {meanings.map((m, i) => (
                          <MeaningBlock
                            key={`${wordType}-${i}`}
                            index={i}
                            value={m}
                            onChange={(v) => setMeaningForType(wordType, i, v)}
                            onRemove={() => removeMeaningForType(wordType, i)}
                            canRemove={meanings.length > 1}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              {Object.keys(sensesByType).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chọn ít nhất một loại từ ở trên để thêm nghĩa và ví dụ.
                </p>
              )}
            </div>

          </div>
        </div>

        <div className="h-px bg-border/60" />

        {/* Section: Thông tin bổ sung */}
        <div className="p-6 sm:p-8">
          <SectionHeader>Thông tin bổ sung</SectionHeader>

          <div className="space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <FieldLabel icon={FolderTree}>Category</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={categoryId || undefined}
                  onValueChange={(v) => setCategoryId(v ?? "")}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Chọn category (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không chọn</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateCategoryOpen(true)}
                  className="shrink-0"
                >
                  <FolderPlus className="size-4 mr-1" />
                  Tạo category
                </Button>
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <FieldLabel icon={Tag} htmlFor="topic">Chủ đề</FieldLabel>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Business, Travel, Education..."
                list="topic-list"
              />
              {topicSuggestions.length > 0 && (
                <datalist id="topic-list">
                  {topicSuggestions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <FieldLabel icon={StickyNote} htmlFor="notes">Ghi chú</FieldLabel>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm ghi chú, mẹo ghi nhớ hoặc thông tin bổ sung..."
                rows={3}
              />
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <FieldLabel icon={ImageIcon}>Ảnh minh họa</FieldLabel>
              <ImageUpload imageUrls={imageUrls} onChange={setImageUrls} />
            </div>

            {/* Related words */}
            <div className="space-y-4">
              <FieldLabel icon={Link2}>Từ liên quan</FieldLabel>
              <EntryIdSelect
                label="Word family"
                ids={wordFamilyIds}
                onChange={setWordFamilyIds}
                excludeId={mode === "edit" ? initialEntry?.id : undefined}
              />
              <EntryIdSelect
                label="Từ đồng nghĩa"
                ids={synonymIds}
                onChange={setSynonymIds}
                excludeId={mode === "edit" ? initialEntry?.id : undefined}
              />
              <EntryIdSelect
                label="Từ trái nghĩa"
                ids={antonymIds}
                onChange={setAntonymIds}
                excludeId={mode === "edit" ? initialEntry?.id : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="flex-1 h-12 text-base font-semibold rounded-xl shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          <Save className="size-5 mr-2" />
          {saving ? "Đang lưu…" : "Lưu từ vựng"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="sm:w-auto h-12 text-base rounded-xl"
        >
          Hủy
        </Button>
      </div>

      {/* Dialog tạo category nhanh */}
      <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
        <DialogContent showCloseButton className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Tạo category mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="new-category-name">Tên category</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ví dụ: Business, IELTS..."
              disabled={creatingCategory}
            />
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => {
                setCreateCategoryOpen(false);
                setNewCategoryName("");
              }}
              className="rounded-lg"
            >
              Hủy
            </Button>
            <Button
              className="rounded-lg"
              disabled={!newCategoryName.trim() || creatingCategory}
              onClick={async () => {
                const name = newCategoryName.trim();
                if (!name) return;
                setCreatingCategory(true);
                try {
                  const created = await apiCreateCategory({ name });
                  const list = await apiGetCategories();
                  setCategories(list);
                  setCategoryId(created.id);
                  setCreateCategoryOpen(false);
                  setNewCategoryName("");
                  toast.success("Đã tạo category và đã chọn.");
                } catch {
                  toast.error("Không thể tạo category.");
                } finally {
                  setCreatingCategory(false);
                }
              }}
            >
              {creatingCategory ? "Đang tạo…" : "Tạo và chọn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

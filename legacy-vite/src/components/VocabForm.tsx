import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { VocabEntry, WordType, Meaning } from "@/types/vocab";
import { WORD_TYPE_LABELS } from "@/types/vocab";
import { create, update, type VocabEntryCreate } from "@/lib/vocab-service";
import { getTopics } from "@/lib/vocab-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeaningBlock } from "@/components/MeaningBlock";
import { ImageUpload } from "@/components/ImageUpload";
import { EntryIdSelect } from "@/components/EntryIdSelect";
import { Plus, ArrowLeft } from "lucide-react";

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

function validate(
  word: string,
  types: WordType[],
  meanings: Meaning[]
): string | null {
  if (!word.trim()) return "Vui lòng nhập từ.";
  if (types.length === 0) return "Vui lòng chọn ít nhất một loại từ.";
  if (meanings.length === 0) return "Vui lòng thêm ít nhất một nghĩa.";
  for (let i = 0; i < meanings.length; i++) {
    const m = meanings[i];
    if (!m.vietnamese.trim()) return `Nghĩa ${i + 1}: vui lòng nhập nghĩa tiếng Việt.`;
    const validExamples = m.examples.map((e) => e.trim()).filter(Boolean);
    if (validExamples.length === 0)
      return `Nghĩa ${i + 1}: cần ít nhất một ví dụ.`;
    if (validExamples.length > 3)
      return `Nghĩa ${i + 1}: tối đa 3 ví dụ.`;
  }
  return null;
}

export function VocabForm({ mode, initialEntry }: VocabFormProps) {
  const navigate = useNavigate();
  const [word, setWord] = useState("");
  const [types, setTypes] = useState<WordType[]>([]);
  const [meanings, setMeanings] = useState<Meaning[]>([{ ...defaultMeaning }]);
  const [notes, setNotes] = useState("");
  const [topic, setTopic] = useState("");
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [wordFamilyIds, setWordFamilyIds] = useState<string[]>([]);
  const [synonymIds, setSynonymIds] = useState<string[]>([]);
  const [antonymIds, setAntonymIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialEntry) {
      setWord(initialEntry.word);
      setTypes(initialEntry.types.length ? [...initialEntry.types] : []);
      setMeanings(
        initialEntry.meanings.length
          ? initialEntry.meanings.map((m) => ({
              vietnamese: m.vietnamese,
              examples:
                m.examples.length > 0
                  ? [...m.examples]
                  : [""],
            }))
          : [{ ...defaultMeaning }]
      );
      setNotes(initialEntry.notes ?? "");
      setTopic(initialEntry.topic ?? "");
      setImageUrls(initialEntry.imageUrls ?? []);
      setWordFamilyIds(initialEntry.wordFamilyIds ?? []);
      setSynonymIds(initialEntry.synonymIds ?? []);
      setAntonymIds(initialEntry.antonymIds ?? []);
    }
  }, [initialEntry?.id]);

  useEffect(() => {
    getTopics().then(setTopicSuggestions);
  }, []);

  const toggleType = (t: WordType) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const setMeaning = (index: number, value: Meaning) => {
    setMeanings((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addMeaning = () => {
    setMeanings((prev) => [...prev, { ...defaultMeaning }]);
  };

  const removeMeaning = (index: number) => {
    if (meanings.length <= 1) return;
    setMeanings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(word, types, meanings);
    if (err) {
      toast.error(err);
      return;
    }

    const normalizedMeanings = meanings.map(normalizeMeaning).filter((m) => m.vietnamese && m.examples.some(Boolean));
    if (normalizedMeanings.length === 0) {
      toast.error("Cần ít nhất một nghĩa có nội dung.");
      return;
    }
    // Ensure 1-3 examples each
    const finalMeanings: Meaning[] = normalizedMeanings.map((m) => ({
      vietnamese: m.vietnamese,
      examples: m.examples.slice(0, 3),
    }));

    setSaving(true);
    try {
      if (mode === "add") {
        const data: VocabEntryCreate = {
          word: word.trim(),
          types,
          meanings: finalMeanings,
          notes: notes.trim() || undefined,
          topic: topic.trim() || undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          wordFamilyIds: wordFamilyIds.length ? wordFamilyIds : undefined,
          synonymIds: synonymIds.length ? synonymIds : undefined,
          antonymIds: antonymIds.length ? antonymIds : undefined,
        };
        await create(data);
        toast.success("Đã thêm từ.");
      } else if (initialEntry) {
        const updated: VocabEntry = {
          ...initialEntry,
          word: word.trim(),
          types,
          meanings: finalMeanings,
          notes: notes.trim() || undefined,
          topic: topic.trim() || undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          wordFamilyIds: wordFamilyIds.length ? wordFamilyIds : undefined,
          synonymIds: synonymIds.length ? synonymIds : undefined,
          antonymIds: antonymIds.length ? antonymIds : undefined,
        };
        await update(updated);
        toast.success("Đã cập nhật từ.");
      }
      navigate("/list");
    } catch {
      toast.error("Có lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "add" ? "Thêm từ mới" : "Sửa từ";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-busy={saving} aria-disabled={saving}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4 mr-1" />
            Quay lại
          </Button>
          <Button type="submit" disabled={saving} aria-busy={saving}>
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="word">Từ *</Label>
            <Input
              id="word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Nhập từ vựng"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Loại từ * (chọn ít nhất một)</Label>
            <div className="flex flex-wrap gap-4">
              {WORD_TYPES.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={types.includes(t)}
                    onCheckedChange={() => toggleType(t)}
                  />
                  <span className="text-sm">{WORD_TYPE_LABELS[t]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Nghĩa * (ít nhất một block)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addMeaning}>
                <Plus className="size-4 mr-1" />
                Thêm nghĩa
              </Button>
            </div>
            <div className="space-y-3">
              {meanings.map((m, i) => (
                <MeaningBlock
                  key={i}
                  index={i}
                  value={m}
                  onChange={(v) => setMeaning(i, v)}
                  onRemove={() => removeMeaning(i)}
                  canRemove={meanings.length > 1}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm (tùy chọn)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Chủ đề</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Chủ đề (tùy chọn)"
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

          <ImageUpload imageUrls={imageUrls} onChange={setImageUrls} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liên kết từ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Hủy
        </Button>
        <Button type="submit" disabled={saving} aria-busy={saving}>
          {saving ? "Đang lưu…" : "Lưu"}
        </Button>
      </div>
    </form>
  );
}

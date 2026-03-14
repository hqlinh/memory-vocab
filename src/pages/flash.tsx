import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  apiGetAll,
  apiGetByDate,
  apiGetByDateRange,
  apiGetByTopic,
  apiGetEntriesByIds,
  apiGetTopics,
} from "@/lib/vocab-api";
import type { VocabEntry } from "@/types/vocab";
import { WORD_TYPE_LABELS, getSensesByType, getOrderedWordTypes } from "@/types/vocab";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Image as ImageIcon,
  Layers,
  Play,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PronunciationButton } from "@/components/PronunciationButton";
import { toast } from "sonner";

type FlashMode = "date" | "range" | "topic" | "all";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function formatDateForInput(iso: string): string {
  return iso.slice(0, 10);
}

export default function FlashCard() {
  const [mode, setMode] = useState<FlashMode>("all");
  const [date, setDate] = useState(formatDateForInput(new Date().toISOString()));
  const [startDate, setStartDate] = useState(formatDateForInput(new Date().toISOString()));
  const [endDate, setEndDate] = useState(formatDateForInput(new Date().toISOString()));
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [deck, setDeck] = useState<VocabEntry[]>([]);
  const [relatedMap, setRelatedMap] = useState<Map<string, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetTopics()
      .then((list) => {
        if (!cancelled) {
          setTopics(list);
          if (list.length > 0 && !topic) setTopic(list[0]);
        }
      })
      .catch(() => {
        if (!cancelled) setTopics([]);
        toast.error("Không tải được danh sách chủ đề.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTopics(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      let entries: VocabEntry[] = [];
      if (mode === "date") {
        entries = await apiGetByDate(date);
      } else if (mode === "range") {
        entries = await apiGetByDateRange(startDate, endDate);
      } else if (mode === "topic") {
        entries = await apiGetByTopic(topic || "");
      } else {
        entries = await apiGetAll();
      }
      const shuffled = shuffle(entries);
      setDeck(shuffled);

      const allIds = new Set<string>();
      for (const e of shuffled) {
        (e.wordFamilyIds ?? []).forEach((id) => allIds.add(id));
        (e.synonymIds ?? []).forEach((id) => allIds.add(id));
        (e.antonymIds ?? []).forEach((id) => allIds.add(id));
      }
      if (allIds.size > 0) {
        const related = await apiGetEntriesByIds([...allIds]);
        const map = new Map<string, string>();
        related.forEach((e) => map.set(e.id, e.word));
        setRelatedMap(map);
      } else {
        setRelatedMap(new Map());
      }

      setCurrentIndex(0);
      setIsFlipped(false);
      setStarted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được từ vựng.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToConfig = () => {
    setStarted(false);
    setDeck([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentEntry = useMemo(
    () => (deck.length > 0 && currentIndex < deck.length ? deck[currentIndex] : null),
    [deck, currentIndex]
  );
  const atEnd = started && deck.length > 0 && currentIndex >= deck.length;
  const noCards = started && deck.length === 0;

  if (noCards) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-4">
              Không có từ nào trong chế độ đã chọn.
            </p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Thử chọn chế độ khác hoặc thêm từ mới từ danh sách.
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button variant="outline" onClick={handleBackToConfig} className="rounded-lg">
                <RotateCcw className="size-4 mr-1" />
                Chọn lại chế độ
              </Button>
              <Link href="/add" className={buttonVariants({ className: "rounded-lg" })}>
                Thêm từ
              </Link>
              <Link href="/" className={buttonVariants({ variant: "ghost", className: "rounded-lg" })}>
                Về trang chủ
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (atEnd) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
              <Layers className="size-8" />
            </div>
            <p className="font-semibold text-lg py-2">Đã xem hết!</p>
            <p className="text-sm text-muted-foreground mb-6">
              Bạn đã xem {deck.length} thẻ.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button onClick={handleBackToConfig} className="rounded-xl shadow-md shadow-primary/25">
                <RotateCcw className="size-4 mr-1" />
                Ôn lại
              </Button>
              <Link href="/" className={buttonVariants({ variant: "outline", className: "rounded-xl" })}>
                <Home className="size-4 mr-1 inline" />
                Về trang chủ
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (started && currentEntry) {
    const entry = currentEntry;
    const wordFamilyWords = (entry.wordFamilyIds ?? [])
      .map((id) => relatedMap.get(id))
      .filter(Boolean) as string[];
    const synonymWords = (entry.synonymIds ?? [])
      .map((id) => relatedMap.get(id))
      .filter(Boolean) as string[];
    const antonymWords = (entry.antonymIds ?? [])
      .map((id) => relatedMap.get(id))
      .filter(Boolean) as string[];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} / {deck.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
          />
        </div>

        {/* Card flip: 2D scaleX + opacity, tránh mirror 3D */}
        <div
          className="w-full max-w-md mx-auto cursor-pointer select-none relative min-h-[320px]"
          onClick={() => setIsFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsFlipped((f) => !f);
            }
          }}
          aria-label={isFlipped ? "Lật lại mặt trước" : "Lật xem mặt sau"}
        >
          <div
            key={currentIndex}
            className="absolute inset-0 transition-all duration-[500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98]"
            style={{ animation: "card-enter 0.4s ease-out both" }}
          >
            {/* Mặt trước - từ vựng */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden transition-all duration-300 ease-out"
              style={{
                opacity: isFlipped ? 0 : 1,
                transform: isFlipped ? "scaleX(0)" : "scaleX(1)",
                transformOrigin: "center",
                pointerEvents: isFlipped ? "none" : "auto",
                zIndex: isFlipped ? 0 : 1,
              }}
            >
              <div
                className="h-full w-full rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl shadow-primary/10"
                style={{ boxShadow: "0 4px 24px -4px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.04)" }}
              >
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.52_0.22_280/0.08),transparent)]" />
                <Card className="h-full border-0 shadow-none rounded-2xl bg-transparent">
                  <CardContent className="relative flex flex-col items-center justify-center min-h-[320px] p-8">
                    <span className="absolute top-4 left-4 text-[10px] font-medium uppercase tracking-widest text-primary/60">
                      Mặt trước
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-3xl font-bold text-center text-foreground drop-shadow-sm">{entry.word}</p>
                      <PronunciationButton word={entry.word} size="icon" className="rounded-full" showPhonetic />
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                      {entry.types.map((t) => (
                        <Badge key={t} className="rounded-full bg-primary/15 text-primary border border-primary/20">
                          {WORD_TYPE_LABELS[t]}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-8 flex items-center gap-1.5">
                      <span className="inline-block size-1.5 rounded-full bg-primary/50 animate-pulse" />
                      Nhấn hoặc click để lật thẻ
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mặt sau - nghĩa chi tiết */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden transition-all duration-300 ease-out"
              style={{
                opacity: isFlipped ? 1 : 0,
                transform: isFlipped ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "center",
                pointerEvents: isFlipped ? "auto" : "none",
                zIndex: isFlipped ? 1 : 0,
              }}
            >
              <div
                className="h-full w-full rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/10 shadow-xl"
                style={{ boxShadow: "0 4px 24px -4px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.04)" }}
              >
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,oklch(0.52_0.22_280/0.06),transparent)]" />
                <Card className="h-full border-0 shadow-none overflow-hidden rounded-2xl bg-transparent">
                  <ScrollArea className="h-[320px]">
                    <CardContent className="relative p-6 text-sm space-y-4">
                      <span className="absolute top-4 right-4 text-[10px] font-medium uppercase tracking-widest text-primary/60">
                        Mặt sau
                      </span>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground mb-1.5">Nghĩa theo loại từ</h4>
                      {getOrderedWordTypes()
                        .filter((t) => getSensesByType(entry)[t]?.length)
                        .map((wordType) => {
                          const meanings = getSensesByType(entry)[wordType] ?? [];
                          return (
                            <div key={wordType} className="rounded-lg border border-border/40 bg-muted/20 p-2">
                              <p className="text-xs font-semibold text-primary mb-1">
                                {WORD_TYPE_LABELS[wordType]}
                              </p>
                              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                {meanings.map((m, i) => (
                                  <li key={i}>
                                    <span className="text-foreground font-medium">{m.vietnamese}</span>
                                    {m.examples.length > 0 && (
                                      <ul className="mt-0.5 ml-4 list-none text-muted-foreground">
                                        {m.examples.map((ex, j) => (
                                          <li key={j}>• {ex}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
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
                              className="rounded-xl border object-cover size-16"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {(wordFamilyWords.length > 0 ||
                      synonymWords.length > 0 ||
                      antonymWords.length > 0) && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          Từ liên quan
                        </h4>
                        <div className="flex flex-wrap gap-1 text-muted-foreground">
                          {wordFamilyWords.length > 0 && (
                            <span>
                              Family: {wordFamilyWords.join(", ")}
                            </span>
                          )}
                          {synonymWords.length > 0 && (
                            <span>
                              Đồng nghĩa: {synonymWords.join(", ")}
                            </span>
                          )}
                          {antonymWords.length > 0 && (
                            <span>
                              Trái nghĩa: {antonymWords.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            disabled={currentIndex === 0}
            className="rounded-xl size-11 transition-all hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((i) => Math.max(0, i - 1));
              setIsFlipped(false);
            }}
            aria-label="Thẻ trước"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            className="rounded-xl px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/25 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped((f) => !f);
            }}
            aria-label={isFlipped ? "Lật lại mặt trước" : "Lật xem mặt sau"}
          >
            {isFlipped ? "↩ Lật lại" : "Lật thẻ"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl size-11 transition-all hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              if (currentIndex < deck.length - 1) {
                setCurrentIndex((i) => i + 1);
                setIsFlipped(false);
              } else {
                setCurrentIndex(deck.length);
              }
            }}
            aria-label="Thẻ tiếp"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={handleBackToConfig} className="text-muted-foreground">
            Chọn lại chế độ
          </Button>
        </div>
      </div>
    );
  }

  const modeOptions: { value: FlashMode; label: string; description: string }[] = [
    { value: "date", label: "Theo ngày", description: "Ôn từ vựng theo một ngày cụ thể." },
    { value: "range", label: "Theo range", description: "Ôn từ vựng trong khoảng ngày." },
    { value: "topic", label: "Theo chủ đề", description: "Ôn theo chủ đề đã gắn." },
    { value: "all", label: "Random all", description: "Ôn toàn bộ từ vựng, thứ tự ngẫu nhiên." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
          <Layers className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
          <p className="text-sm text-muted-foreground">
            Chọn chế độ ôn và bấm &quot;Bắt đầu ôn&quot;.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm space-y-6">
        {/* Chế độ ôn: dạng thẻ, mỗi thẻ có title + mô tả */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                mode === opt.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <span className="font-semibold text-foreground block">{opt.label}</span>
              <span className="text-sm text-muted-foreground mt-1 block leading-snug">
                {opt.description}
              </span>
            </button>
          ))}
        </div>

        {/* Vùng cấu hình theo chế độ — cùng chiều cao, căn chỉnh gọn */}
        <div className="min-h-[120px] rounded-xl bg-muted/30 border border-border/40 p-4">
          {mode === "date" && (
            <div className="space-y-2">
              <Label className="text-foreground">Chọn ngày</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="max-w-xs rounded-lg"
              />
            </div>
          )}
          {mode === "range" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Từ ngày</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Đến ngày</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
          {mode === "topic" && (
            <div className="space-y-2">
              <Label className="text-foreground">Chủ đề</Label>
              <Select
                value={topic || undefined}
                onValueChange={(v) => setTopic(v ?? "")}
                disabled={loadingTopics}
              >
                <SelectTrigger className="max-w-xs rounded-lg">
                  <SelectValue placeholder="Chọn chủ đề" />
                </SelectTrigger>
                <SelectContent>
                  {topics.length === 0 ? (
                    <SelectItem value="">(Không có chủ đề)</SelectItem>
                  ) : (
                    topics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {loadingTopics && (
                <p className="text-xs text-muted-foreground">Đang tải danh sách chủ đề...</p>
              )}
            </div>
          )}
          {mode === "all" && (
            <p className="text-sm text-muted-foreground py-2">
              Không cần cấu hình thêm — bấm &quot;Bắt đầu ôn&quot; để ôn toàn bộ từ.
            </p>
          )}
        </div>

        <div>
          <Button
            onClick={handleStart}
            disabled={loading || (mode === "topic" && loadingTopics)}
            aria-busy={loading}
            className="w-full sm:w-auto h-11 rounded-xl shadow-md shadow-primary/25 text-base font-semibold px-8"
          >
            {loading ? (
              <>
                <LoadingSpinner size={18} className="mr-2 shrink-0" />
                Đang tải...
              </>
            ) : (
              <>
                <Play className="size-4 mr-2" />
                Bắt đầu ôn
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

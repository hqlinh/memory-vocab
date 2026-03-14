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
import { WORD_TYPE_LABELS } from "@/types/vocab";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
          />
        </div>

        <div
          className="perspective-[1000px] w-full max-w-md mx-auto cursor-pointer"
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
            className="relative w-full min-h-[300px] transition-transform duration-500 preserve-3d"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border border-border/60 bg-card shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <Card className="h-full border-0 shadow-none rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
                  <p className="text-3xl font-bold text-center text-foreground">{entry.word}</p>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                    {entry.types.map((t) => (
                      <Badge key={t} className="rounded-full bg-primary/10 text-primary border-0">
                        {WORD_TYPE_LABELS[t]}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-6">Nhấn để lật thẻ</p>
                </CardContent>
              </Card>
            </div>
            <div
              className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border border-border/60 bg-card shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: isFlipped ? "rotateY(0deg)" : "rotateY(-180deg)",
              }}
            >
              <Card className="h-full border-0 shadow-none overflow-hidden rounded-2xl">
                <ScrollArea className="h-[300px]">
                  <CardContent className="p-6 text-sm space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1.5">Nghĩa</h4>
                      <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                        {entry.meanings.map((m, i) => (
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

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            disabled={currentIndex === 0}
            className="rounded-xl size-10"
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
            variant="outline"
            className="rounded-xl px-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped((f) => !f);
            }}
            aria-label={isFlipped ? "Lật lại mặt trước" : "Lật xem mặt sau"}
          >
            Lật
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl size-10"
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

      <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as FlashMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted/60">
            <TabsTrigger value="date" className="rounded-lg">Theo ngày</TabsTrigger>
            <TabsTrigger value="range" className="rounded-lg">Theo range</TabsTrigger>
            <TabsTrigger value="topic" className="rounded-lg">Theo chủ đề</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg">Random all</TabsTrigger>
          </TabsList>
          <TabsContent value="date" className="mt-5">
            <div className="space-y-2">
              <Label>Chọn ngày</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </TabsContent>
          <TabsContent value="range" className="mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Từ ngày</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Đến ngày</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="topic" className="mt-5">
            <div className="space-y-2">
              <Label>Chủ đề</Label>
              <Select
                value={topic || undefined}
                onValueChange={(v) => setTopic(v ?? "")}
                disabled={loadingTopics}
              >
                <SelectTrigger className="max-w-xs">
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
          </TabsContent>
          <TabsContent value="all" className="mt-5">
            <p className="text-sm text-muted-foreground">
              Ôn toàn bộ từ vựng, thứ tự ngẫu nhiên.
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
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

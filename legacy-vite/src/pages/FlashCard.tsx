import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAll,
  getByDate,
  getByDateRange,
  getByTopic,
  getEntriesByIds,
  getTopics,
} from "@/lib/vocab-service";
import type { VocabEntry } from "@/types/vocab";
import { WORD_TYPE_LABELS } from "@/types/vocab";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
    getTopics().then((list) => {
      if (!cancelled) {
        setTopics(list);
        if (list.length > 0 && !topic) setTopic(list[0]);
      }
    }).finally(() => { if (!cancelled) setLoadingTopics(false); });
    return () => { cancelled = true; };
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      let entries: VocabEntry[] = [];
      if (mode === "date") {
        entries = await getByDate(date);
      } else if (mode === "range") {
        entries = await getByDateRange(startDate, endDate);
      } else if (mode === "topic") {
        entries = await getByTopic(topic || "");
      } else {
        entries = await getAll();
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
        const related = await getEntriesByIds([...allIds]);
        const map = new Map<string, string>();
        related.forEach((e) => map.set(e.id, e.word));
        setRelatedMap(map);
      } else {
        setRelatedMap(new Map());
      }

      setCurrentIndex(0);
      setIsFlipped(false);
      setStarted(true);
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-4">
              Không có từ nào trong chế độ đã chọn.
            </p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Thử chọn chế độ khác hoặc thêm từ mới từ danh sách.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleBackToConfig}>
                <RotateCcw className="size-4 mr-1" />
                Chọn lại chế độ
              </Button>
              <Button render={<Link to="/add" />}>
                Thêm từ
              </Button>
              <Button variant="ghost" render={<Link to="/" />}>
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (atEnd) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center font-medium py-4">Đã xem hết</p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Bạn đã xem {deck.length} thẻ.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={handleBackToConfig}>
                <RotateCcw className="size-4 mr-1" />
                Ôn lại
              </Button>
              <Button variant="outline" render={<Link to="/" />}>
                <Home className="size-4 mr-1" />
                Về trang chủ
              </Button>
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
        <p className="text-muted-foreground text-sm">
          {currentIndex + 1} / {deck.length}
        </p>

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
            className="relative w-full min-h-[280px] transition-transform duration-500 preserve-3d"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 w-full h-full backface-hidden rounded-xl border bg-card shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <Card className="h-full border-0 shadow-none">
                <CardContent className="flex flex-col items-center justify-center min-h-[280px] p-6">
                  <p className="text-2xl font-bold text-center">{entry.word}</p>
                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {entry.types.map((t) => (
                      <Badge key={t} variant="secondary">
                        {WORD_TYPE_LABELS[t]}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">Nhấn để lật thẻ</p>
                </CardContent>
              </Card>
            </div>
            <div
              className="absolute inset-0 w-full h-full backface-hidden rounded-xl border bg-card shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: isFlipped ? "rotateY(0deg)" : "rotateY(-180deg)",
              }}
            >
              <Card className="h-full border-0 shadow-none overflow-hidden">
                <ScrollArea className="h-[280px]">
                  <CardContent className="p-4 text-sm space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Nghĩa</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {entry.meanings.map((m, i) => (
                          <li key={i}>
                            <span className="text-foreground">{m.vietnamese}</span>
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
                              className="rounded border object-cover size-16"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {(wordFamilyWords.length > 0 ||
                      synonymWords.length > 0 ||
                      antonymWords.length > 0) && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1">
                          Word family / Đồng nghĩa / Trái nghĩa
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

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            disabled={currentIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((i) => Math.max(0, i - 1));
              setIsFlipped(false);
            }}
            aria-label="Thẻ trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
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
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={handleBackToConfig}>
            Chọn lại chế độ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Flash Card</h1>
      <p className="text-muted-foreground text-sm">
        Chọn chế độ ôn và bấm &quot;Bắt đầu ôn&quot;.
      </p>

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as FlashMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="date">Theo ngày</TabsTrigger>
          <TabsTrigger value="range">Theo range</TabsTrigger>
          <TabsTrigger value="topic">Theo chủ đề</TabsTrigger>
          <TabsTrigger value="all">Random all</TabsTrigger>
        </TabsList>
        <TabsContent value="date" className="mt-4">
          <div className="space-y-2">
            <Label>Chọn ngày</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </TabsContent>
        <TabsContent value="range" className="mt-4">
          <div className="space-y-4">
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
        <TabsContent value="topic" className="mt-4">
          <div className="space-y-2">
            <Label>Chủ đề</Label>
            <Select
              value={topic || undefined}
              onValueChange={(v) => setTopic(v ?? "")}
              disabled={loadingTopics}
            >
              <SelectTrigger>
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
        <TabsContent value="all" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Ôn toàn bộ từ vựng, thứ tự ngẫu nhiên.
          </p>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleStart}
        disabled={loading || (mode === "topic" && loadingTopics)}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <LoadingSpinner size={18} className="mr-2 shrink-0" />
            Đang tải...
          </>
        ) : (
          "Bắt đầu ôn"
        )}
      </Button>
    </div>
  );
}

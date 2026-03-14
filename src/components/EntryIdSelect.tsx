import { useState, useEffect, useRef } from "react";
import { apiSearchEntriesByWord, apiGetEntriesByIds } from "@/lib/vocab-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EntryIdSelectProps {
  label: string;
  ids: string[];
  onChange: (ids: string[]) => void;
  excludeId?: string;
}

export function EntryIdSelect({
  label,
  ids,
  onChange,
  excludeId,
}: EntryIdSelectProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; word: string }[]>(
    []
  );
  const [open, setOpen] = useState(false);
  const [words, setWords] = useState<Record<string, string>>({});
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (ids.length === 0) {
      setWords({});
      return;
    }
    const fetchId = ++fetchIdRef.current;
    apiGetEntriesByIds(ids)
      .then((entries) => {
        if (fetchId !== fetchIdRef.current) return;
        const map: Record<string, string> = {};
        entries.forEach((e) => {
          map[e.id] = e.word;
        });
        setWords(map);
      })
      .catch(() => {
        if (fetchId === fetchIdRef.current) setWords({});
      });
  }, [ids.join(",")]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearchError(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearchError(false);
      apiSearchEntriesByWord(query.trim(), excludeId)
        .then((list) => {
          const existing = new Set(ids);
          setSuggestions(list.filter((item) => !existing.has(item.id)));
        })
        .catch(() => {
          setSuggestions([]);
          setSearchError(true);
        });
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, excludeId, ids.join(",")]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const add = (item: { id: string; word: string }) => {
    if (ids.includes(item.id)) return;
    onChange([...ids, item.id]);
    setQuery("");
    setSuggestions((s) => s.filter((x) => x.id !== item.id));
  };

  const remove = (id: string) => {
    onChange(ids.filter((x) => x !== id));
  };

  return (
    <div ref={wrapperRef} className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Gõ để tìm từ trong danh sách..."
        />
        {open && suggestions.length > 0 && (
          <ul
            className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-md"
            role="listbox"
          >
            {suggestions.map((item) => (
              <li
                key={item.id}
                role="option"
                className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                onClick={() => add(item)}
              >
                {item.word}
              </li>
            ))}
          </ul>
        )}
        {searchError && (
          <p className="text-xs text-destructive mt-1">
            Không thể tìm từ. Kiểm tra kết nối và thử lại.
          </p>
        )}
      </div>
      {ids.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {words[id] ?? id}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => remove(id)}
                aria-label="Xóa"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

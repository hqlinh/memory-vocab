import type { Meaning } from "@/types/vocab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

const MAX_EXAMPLES = 3;

interface MeaningBlockProps {
  value: Meaning;
  onChange: (value: Meaning) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}

export function MeaningBlock({
  value,
  onChange,
  onRemove,
  canRemove,
  index,
}: MeaningBlockProps) {
  const addExample = () => {
    if (value.examples.length >= MAX_EXAMPLES) return;
    onChange({ ...value, examples: [...value.examples, ""] });
  };

  const removeExample = (i: number) => {
    const next = value.examples.filter((_, j) => j !== i);
    onChange({ ...value, examples: next });
  };

  const setExample = (i: number, text: string) => {
    const next = [...value.examples];
    next[i] = text;
    onChange({ ...value, examples: next });
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor={`meaning-vn-${index}`}>Nghĩa tiếng Việt</Label>
          <Input
            id={`meaning-vn-${index}`}
            value={value.vietnamese}
            onChange={(e) => onChange({ ...value, vietnamese: e.target.value })}
            placeholder="Nhập nghĩa"
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label="Xóa nghĩa"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Ví dụ (1–3)</Label>
          {value.examples.length < MAX_EXAMPLES && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={addExample}
              aria-label="Thêm ví dụ"
            >
              <Plus className="size-3.5 mr-1" />
              Thêm ví dụ
            </Button>
          )}
        </div>
        {value.examples.map((ex, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={ex}
              onChange={(e) => setExample(i, e.target.value)}
              placeholder={`Ví dụ ${i + 1}`}
              className="flex-1"
            />
            {value.examples.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeExample(i)}
                aria-label="Xóa ví dụ"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

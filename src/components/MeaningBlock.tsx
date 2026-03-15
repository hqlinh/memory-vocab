import type { Meaning } from "@/types/vocab";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

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
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor={`meaning-vn-${index}`} className="text-sm font-medium">
            Nghĩa tiếng Việt
          </Label>
          <Textarea
            id={`meaning-vn-${index}`}
            value={value.vietnamese}
            onChange={(e) => onChange({ ...value, vietnamese: e.target.value })}
            placeholder="Nhập nghĩa tiếng Việt của từ..."
            rows={2}
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
            onClick={onRemove}
            aria-label="Xóa nghĩa"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Ví dụ (1–3 câu, mỗi câu một dòng)</Label>
        <Textarea
          value={value.examples.join("\n")}
          onChange={(e) => {
            const raw = e.target.value;
            const lines = raw.split("\n").slice(0, MAX_EXAMPLES);
            onChange({ ...value, examples: lines.length ? lines : [""] });
          }}
          placeholder="Nhập câu ví dụ, mỗi câu một dòng..."
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
}

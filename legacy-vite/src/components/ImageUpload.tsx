import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, X } from "lucide-react";

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

interface ImageUploadProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ imageUrls, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const current = imageUrls.length;
    const toAdd = Math.min(MAX_IMAGES - current, files.length);
    if (toAdd <= 0) return;

    const newUrls: string[] = [];
    for (let i = 0; i < toAdd; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_SIZE_BYTES) continue; // skip oversized
      try {
        const url = await fileToDataUrl(file);
        newUrls.push(url);
      } catch {
        // ignore failed read
      }
    }
    if (newUrls.length) onChange([...imageUrls, ...newUrls]);
    e.target.value = "";
  };

  const remove = (index: number) => {
    onChange(imageUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Ảnh (tối đa {MAX_IMAGES})</Label>
      <div className="flex flex-wrap gap-3">
        {imageUrls.map((url, i) => (
          <div
            key={i}
            className="relative h-20 w-20 rounded-lg border border-border overflow-hidden bg-muted"
          >
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-90"
              onClick={() => remove(i)}
              aria-label="Xóa ảnh"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
        {imageUrls.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-input bg-muted/50 text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Thêm ảnh"
          >
            <ImagePlus className="size-6" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

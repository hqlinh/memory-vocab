import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

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
      if (file.size > MAX_SIZE_BYTES) continue;
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
    <div className="space-y-3">
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url, i) => (
            <div
              key={i}
              className="relative h-24 w-24 rounded-xl border border-border overflow-hidden bg-muted group"
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
                className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(i)}
                aria-label="Xóa ảnh"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {imageUrls.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Thêm ảnh"
        >
          <ImagePlus className="size-8 text-primary/40 mb-2" />
          <span className="text-sm font-medium text-foreground/70">Nhấn để chọn ảnh</span>
          <span className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF (tối đa 5MB)</span>
        </button>
      )}
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

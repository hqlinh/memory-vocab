"use client";

import { Button } from "@/components/ui/button";
import { usePronunciation } from "@/hooks/usePronunciation";
import { Volume2 } from "lucide-react";

type Props = {
  word: string;
  size?: "default" | "sm" | "icon" | "lg" | "xs" | "icon-xs";
  variant?: "ghost" | "outline" | "default" | "secondary" | "link" | "destructive";
  className?: string;
  showPhonetic?: boolean;
};

export function PronunciationButton({
  word,
  size = "icon",
  variant = "ghost",
  className,
  showPhonetic = false,
}: Props) {
  const { audioUrl, phonetic, loading, error, play } = usePronunciation(word);
  const hasAudio = !!audioUrl;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          play();
        }}
        disabled={loading}
        title={error ?? (hasAudio ? "Phát âm" : "Tải phát âm")}
        aria-label={error ?? (hasAudio ? "Phát âm" : "Tải phát âm")}
      >
        {loading ? (
          <span className="size-4 animate-pulse rounded-full bg-current opacity-70" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </Button>
      {showPhonetic && phonetic && (
        <span className="text-xs text-muted-foreground" title="Phiên âm">
          {phonetic}
        </span>
      )}
    </span>
  );
}

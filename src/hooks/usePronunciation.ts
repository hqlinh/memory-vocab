import { useCallback, useEffect, useState } from "react";

type State = {
  audioUrl: string | null;
  phonetic: string | null;
  loading: boolean;
  error: string | null;
};

const clientCache = new Map<string, State>();

function speakWithBrowser(word: string): boolean {
  const w = word?.trim();
  if (!w || typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    const u = new SpeechSynthesisUtterance(w);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

function getInitialState(key: string): State {
  if (!key) return { audioUrl: null, phonetic: null, loading: false, error: null };
  const cached = clientCache.get(key);
  if (cached) return { ...cached, loading: false };
  return { audioUrl: null, phonetic: null, loading: false, error: null };
}

export function usePronunciation(word: string | undefined) {
  const key = word?.trim().toLowerCase() ?? "";
  const [state, setState] = useState<State>(() => getInitialState(key));

  useEffect(() => {
    setState(getInitialState(key));
  }, [key]);

  const fetchPronunciation = useCallback(async () => {
    if (!key) return;
    const textToSpeak = word?.trim() || key;
    const playFallback = () => speakWithBrowser(textToSpeak);

    const cached = clientCache.get(key);
    if (cached?.audioUrl) {
      const audio = new Audio(cached.audioUrl);
      audio.play().catch(playFallback);
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/api/pronunciation/${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!res.ok) {
        const err = data?.error ?? "Không tìm thấy phát âm";
        setState({ audioUrl: null, phonetic: null, loading: false, error: err });
        playFallback();
        return;
      }
      const { audioUrl, phonetic } = data;
      const next = {
        audioUrl: audioUrl ?? null,
        phonetic: phonetic ?? null,
        loading: false,
        error: null,
      };
      clientCache.set(key, next);
      setState(next);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(playFallback);
      } else {
        playFallback();
      }
    } catch {
      setState({
        audioUrl: null,
        phonetic: null,
        loading: false,
        error: "Lỗi tải phát âm",
      });
      playFallback();
    }
  }, [key, word]);

  return {
    ...state,
    play: fetchPronunciation,
  };
}

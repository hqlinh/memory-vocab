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
    if (!key) {
      setState(getInitialState(key));
      return;
    }

    const cached = clientCache.get(key);
    if (cached) {
      setState({ ...cached, loading: false });
      return;
    }

    let isMounted = true;
    setState({ audioUrl: null, phonetic: null, loading: true, error: null });

    fetch(`/api/pronunciation/${encodeURIComponent(key)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = data?.error ?? "Không tìm thấy phát âm";
          const next = { audioUrl: null, phonetic: null, loading: false, error: err };
          clientCache.set(key, next);
          if (isMounted) setState(next);
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
        if (isMounted) setState(next);
      })
      .catch(() => {
        const next = { audioUrl: null, phonetic: null, loading: false, error: "Lỗi tải phát âm" };
        clientCache.set(key, next);
        if (isMounted) setState(next);
      });

    return () => {
      isMounted = false;
    };
  }, [key]);

  const play = useCallback(() => {
    if (!key) return;
    const textToSpeak = word?.trim() || key;
    const playFallback = () => speakWithBrowser(textToSpeak);

    if (state.audioUrl) {
      try {
        const audio = new Audio(state.audioUrl);
        audio.play().catch(playFallback);
      } catch {
        playFallback();
      }
    } else {
      playFallback();
    }
  }, [key, word, state.audioUrl]);

  return {
    ...state,
    play,
  };
}

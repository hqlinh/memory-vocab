import type { NextApiRequest, NextApiResponse } from "next";

const DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en";

type Cached = { audioUrl: string; phonetic?: string };
const cache = new Map<string, Cached>();

function normalizeWord(w: string): string {
  return w.trim().toLowerCase().replace(/\s+/g, "-");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const word = typeof req.query.word === "string" ? req.query.word : "";
  const key = normalizeWord(word);
  if (!key) {
    return res.status(400).json({ error: "Missing or invalid word" });
  }

  const cached = cache.get(key);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const resp = await fetch(`${DICT_API}/${encodeURIComponent(key)}`, {
      headers: { "Accept": "application/json" },
    });
    if (!resp.ok) {
      if (resp.status === 404) {
        return res.status(404).json({ error: "Word not found" });
      }
      throw new Error(`Dictionary API ${resp.status}`);
    }
    const data = await resp.json();
    const first = Array.isArray(data) ? data[0] : data;
    const phonetics = first?.phonetics;
    let audioUrl = "";
    let phonetic = "";
    if (Array.isArray(phonetics)) {
      for (const p of phonetics) {
        if (p?.audio && typeof p.audio === "string" && p.audio.trim()) {
          audioUrl = p.audio.startsWith("http") ? p.audio : `https:${p.audio}`;
          if (p.text && typeof p.text === "string") phonetic = p.text;
          break;
        }
      }
    }
    if (!audioUrl) {
      return res.status(404).json({ error: "No pronunciation audio" });
    }
    const result: Cached = { audioUrl, phonetic: phonetic || undefined };
    cache.set(key, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error("pronunciation API", err);
    return res.status(502).json({ error: "Failed to fetch pronunciation" });
  }
}

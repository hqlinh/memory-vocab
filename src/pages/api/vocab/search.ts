import type { NextApiRequest, NextApiResponse } from "next";
import * as vocabService from "@/lib/vocab-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  const q = req.query.q as string | undefined;
  const excludeId = req.query.excludeId as string | undefined;
  try {
    const list = await vocabService.searchEntriesByWord(q ?? "", excludeId);
    return res.status(200).json(list);
  } catch (err) {
    console.error("GET /api/vocab/search", err);
    return res.status(500).json({ error: "Failed to search" });
  }
}

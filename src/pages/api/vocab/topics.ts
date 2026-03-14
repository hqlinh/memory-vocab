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
  try {
    const topics = await vocabService.getTopics();
    return res.status(200).json(topics);
  } catch (err) {
    console.error("GET /api/vocab/topics", err);
    return res.status(500).json({ error: "Failed to fetch topics" });
  }
}

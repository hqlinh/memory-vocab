import type { NextApiRequest, NextApiResponse } from "next";
import * as vocabService from "@/lib/vocab-service";
import type { VocabEntryCreate } from "@/types/vocab";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { date, start, end, topic, categoryId, ids } = req.query;
    try {
      if (typeof ids === "string" && ids.trim()) {
        const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
        if (idList.length > 0) {
          const list = await vocabService.getEntriesByIds(idList);
          return res.status(200).json(list);
        }
      }
      if (typeof date === "string" && date) {
        const list = await vocabService.getByDate(date);
        return res.status(200).json(list);
      }
      if (typeof start === "string" && typeof end === "string" && start && end) {
        const list = await vocabService.getByDateRange(start, end);
        return res.status(200).json(list);
      }
      if (typeof topic === "string" && topic) {
        const list = await vocabService.getByTopic(topic);
        return res.status(200).json(list);
      }
      if (typeof categoryId === "string" && categoryId) {
        const list = await vocabService.getByCategoryId(categoryId);
        return res.status(200).json(list);
      }
      const list = await vocabService.getAll();
      return res.status(200).json(list);
    } catch (err) {
      console.error("GET /api/vocab", err);
      return res.status(500).json({ error: "Failed to fetch vocab" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as VocabEntryCreate;
      const entry = await vocabService.create(body);
      return res.status(201).json(entry);
    } catch (err) {
      console.error("POST /api/vocab", err);
      return res.status(500).json({ error: "Failed to create vocab" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

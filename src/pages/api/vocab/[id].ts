import type { NextApiRequest, NextApiResponse } from "next";
import * as vocabService from "@/lib/vocab-service";
import type { VocabEntry } from "@/types/vocab";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  if (req.method === "GET") {
    try {
      const entry = await vocabService.getById(id);
      if (!entry) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(entry);
    } catch (err) {
      console.error("GET /api/vocab/[id]", err);
      return res.status(500).json({ error: "Failed to fetch vocab" });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = req.body as VocabEntry;
      if (body.id !== id) {
        return res.status(400).json({ error: "id in body does not match URL" });
      }
      const entry = await vocabService.update(body);
      return res.status(200).json(entry);
    } catch (err) {
      console.error("PUT /api/vocab/[id]", err);
      return res.status(500).json({ error: "Failed to update vocab" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await vocabService.deleteEntry(id);
      await vocabService.removeIdFromReferences(id);
      return res.status(204).end();
    } catch (err) {
      console.error("DELETE /api/vocab/[id]", err);
      return res.status(500).json({ error: "Failed to delete vocab" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

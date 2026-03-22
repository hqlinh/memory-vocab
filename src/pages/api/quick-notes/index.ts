import type { NextApiRequest, NextApiResponse } from "next";
import * as quickNoteService from "@/lib/quick-note-service";
import type { QuickNoteCreate } from "@/types/quick-note";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const list = await quickNoteService.getAll();
      return res.status(200).json(list);
    } catch (err) {
      console.error("GET /api/quick-notes", err);
      return res.status(500).json({ error: "Failed to fetch quick notes" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as QuickNoteCreate;
      const entry = await quickNoteService.create(body);
      return res.status(201).json(entry);
    } catch (err) {
      console.error("POST /api/quick-notes", err);
      return res.status(500).json({ error: "Failed to create quick note" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

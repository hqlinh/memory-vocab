import type { NextApiRequest, NextApiResponse } from "next";
import * as quickNoteService from "@/lib/quick-note-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;

  if (req.method === "DELETE") {
    try {
      await quickNoteService.deleteEntry(id);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(`DELETE /api/quick-notes/${id}`, err);
      return res.status(500).json({ error: "Failed to delete quick note" });
    }
  }

  res.setHeader("Allow", ["DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

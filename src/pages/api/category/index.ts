import type { NextApiRequest, NextApiResponse } from "next";
import * as categoryService from "@/lib/category-service";
import type { CategoryCreate } from "@/types/category";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const list = await categoryService.getAllCategories();
      return res.status(200).json(list);
    } catch (err) {
      console.error("GET /api/category", err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as CategoryCreate;
      if (!body.name?.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = await categoryService.createCategory({
        name: body.name.trim(),
      });
      return res.status(201).json(category);
    } catch (err) {
      console.error("POST /api/category", err);
      return res.status(500).json({ error: "Failed to create category" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

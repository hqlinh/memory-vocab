import type { NextApiRequest, NextApiResponse } from "next";
import * as categoryService from "@/lib/category-service";
import type { Category } from "@/types/category";

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
      const category = await categoryService.getCategoryById(id);
      if (!category) return res.status(404).json({ error: "Category not found" });
      return res.status(200).json(category);
    } catch (err) {
      console.error("GET /api/category/[id]", err);
      return res.status(500).json({ error: "Failed to fetch category" });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = req.body as Category;
      if (body.id !== id) {
        return res.status(400).json({ error: "Id mismatch" });
      }
      if (!body.name?.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = await categoryService.updateCategory(body);
      return res.status(200).json(category);
    } catch (err) {
      console.error("PUT /api/category/[id]", err);
      return res.status(500).json({ error: "Failed to update category" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await categoryService.deleteCategory(id);
      return res.status(204).end();
    } catch (err) {
      console.error("DELETE /api/category/[id]", err);
      return res.status(500).json({ error: "Failed to delete category" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

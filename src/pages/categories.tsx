import { useEffect, useState } from "react";
import Link from "next/link";
import {
  apiGetCategories,
  apiCreateCategory,
  apiDeleteCategory,
} from "@/lib/category-api";
import type { Category } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FolderPlus, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const list = await apiGetCategories();
      setCategories(list);
    } catch {
      toast.error("Không tải được danh sách category.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên category.");
      return;
    }
    setCreating(true);
    try {
      await apiCreateCategory({ name });
      setNewName("");
      await loadCategories();
      toast.success("Đã tạo category.");
    } catch {
      toast.error("Không thể tạo category.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
      toast.success("Đã xóa category.");
    } catch {
      toast.error("Không thể xóa category.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
          <Layers className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Category</h1>
          <p className="text-sm text-muted-foreground">
            Tạo và quản lý category để gán cho từ vựng
          </p>
        </div>
      </div>

      <Card className="rounded-xl border border-border/60 overflow-hidden">
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FolderPlus className="size-4 text-primary" />
            Tạo category mới
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="category-name">Tên category</Label>
              <Input
                id="category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Business, IELTS, Daily..."
                disabled={creating}
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Đang tạo…" : "Tạo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold mb-3">Danh sách category</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có category nào. Tạo category ở trên hoặc chọn khi thêm từ vựng.
          </p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-4 py-3"
              >
                <span className="font-medium">{c.name}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/list?categoryId=${c.id}`}>
                    <Button variant="ghost" size="sm">
                      Xem từ
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(c.id)}
                    aria-label={`Xóa ${c.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent showCloseButton className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Xóa category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteId
              ? `Bạn có chắc muốn xóa category "${categories.find((c) => c.id === deleteId)?.name}"? Các từ vựng thuộc category này sẽ không bị xóa, chỉ bỏ gán category.`
              : ""}
          </p>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-lg">
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg"
              onClick={() => {
                if (deleteId) {
                  handleDelete(deleteId);
                }
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

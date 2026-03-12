import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, List, Layers } from "lucide-react";

const shortcuts = [
  {
    to: "/add",
    icon: Plus,
    title: "Thêm từ mới",
    description: "Thêm từ vựng với nghĩa, ví dụ và ghi chú",
  },
  {
    to: "/list",
    icon: List,
    title: "Danh sách từ",
    description: "Xem và quản lý tất cả từ đã lưu",
  },
  {
    to: "/flash",
    icon: Layers,
    title: "Flash card",
    description: "Ôn tập từ vựng với nhiều chế độ",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Memory Vocab</h1>
        <p className="text-muted-foreground">
          Ghi chép và ôn tập từ vựng hiệu quả
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {shortcuts.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

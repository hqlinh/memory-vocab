import Link from "next/link";
import { Plus, List, Layers, BookOpen, ArrowRight } from "lucide-react";

const features = [
  {
    href: "/add",
    icon: Plus,
    title: "Thêm từ mới",
    description: "Ghi chép từ vựng với nghĩa, ví dụ và ghi chú",
    color: "from-primary to-primary/80",
  },
  {
    href: "/list",
    icon: List,
    title: "Danh sách từ",
    description: "Xem, tìm kiếm và quản lý từ vựng đã lưu",
    color: "from-chart-2 to-chart-3",
  },
  {
    href: "/flash",
    icon: Layers,
    title: "Flash Card",
    description: "Ôn tập từ vựng với thẻ ghi nhớ thông minh",
    color: "from-chart-4 to-chart-5",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-2">
          <BookOpen className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Memory Vocab
        </h1>
        <p className="text-muted-foreground max-w-md">
          Ứng dụng ghi chép và ôn tập từ vựng. Chọn một mục bên dưới để bắt đầu.
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-lg">
        {features.map(({ href, icon: Icon, title, description, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-2xl bg-card border border-border/60 p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className={`flex items-center justify-center size-12 rounded-xl bg-linear-to-br ${color} text-white shrink-0 group-hover:scale-105 transition-transform`}>
              <Icon className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

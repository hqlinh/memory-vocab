import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { Plus, List, Layers, BookOpen, FolderTree, StickyNote } from "lucide-react";

const navItems = [
  { href: "/", icon: BookOpen, label: "Trang chủ", exact: true },
  { href: "/add", icon: Plus, label: "Thêm từ", exact: false },
  { href: "/list", icon: List, label: "Danh sách", exact: false },
  { href: "/quick-notes", icon: StickyNote, label: "Note nhanh", exact: false },
  { href: "/categories", icon: FolderTree, label: "Category", exact: false },
  { href: "/flash", icon: Layers, label: "Flash card", exact: false },
];

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl supports-backdrop-filter:bg-card/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-1 px-4">
          <Link
            href="/"
            className="mr-6 flex items-center gap-2.5 font-bold text-lg group"
          >
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <BookOpen className="size-4" />
            </div>
            <span className="hidden sm:inline bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Memory Vocab
            </span>
          </Link>

          <nav
            className="flex items-center gap-1 overflow-x-auto"
            aria-label="Điều hướng chính"
          >
            {navItems.slice(1).map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 min-w-0 w-full sm:px-6">
        {children}
      </main>
    </div>
  );
}

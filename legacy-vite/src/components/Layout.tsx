import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, List, Layers, BookOpen } from "lucide-react";

const navItems = [
  { to: "/", icon: BookOpen, label: "Trang chủ", end: true },
  { to: "/add", icon: Plus, label: "Thêm từ" },
  { to: "/list", icon: List, label: "Danh sách" },
  { to: "/flash", icon: Layers, label: "Flash card" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-1 px-4">
          <NavLink
            to="/"
            className="mr-4 flex items-center gap-2 font-semibold"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Memory Vocab</span>
          </NavLink>

          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Điều hướng chính">
            {navItems.slice(1).map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 min-w-0 w-full sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

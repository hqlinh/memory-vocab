import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Trang không tồn tại.</p>
      <Link href="/" className={buttonVariants()}>
        Về trang chủ
      </Link>
    </div>
  );
}

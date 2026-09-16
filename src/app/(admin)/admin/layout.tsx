import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/page-guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <nav className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/admin/comptes">Comptes</Link>
          <Link href="/admin/catalogue">Catalogue</Link>
          <Link href="/admin/remises">Remises</Link>
          <Link href="/admin/transport">Transport</Link>
          <Link href="/admin/charte">Charte PDF</Link>
          <Link href="/admin/devis">Devis</Link>
        </nav>
        <span className="text-sm text-zinc-500">{session.user.email}</span>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

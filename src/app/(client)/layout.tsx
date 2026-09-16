import Link from "next/link";
import { requireApprovedClientPage } from "@/lib/auth/page-guards";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireApprovedClientPage();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/tableau-de-bord">Tableau de bord</Link>
          <Link href="/configurateur">Nouveau devis</Link>
        </nav>
        <span className="text-sm text-zinc-500">{session.user.email}</span>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

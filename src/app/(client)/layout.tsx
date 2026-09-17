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
      <header className="flex items-center justify-between border-b-4 border-brand-yellow bg-brand-black px-6 py-4">
        <nav className="flex gap-6 text-sm font-bold uppercase tracking-wide text-brand-yellow">
          <Link href="/tableau-de-bord" className="hover:text-white">
            Tableau de bord
          </Link>
          <Link href="/configurateur" className="hover:text-white">
            Nouveau devis
          </Link>
        </nav>
        <span className="text-sm text-zinc-300">{session.user.email}</span>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

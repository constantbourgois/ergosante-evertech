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
      <header className="flex items-center justify-between border-b-4 border-brand-yellow bg-brand-black px-6 py-4">
        <nav className="flex flex-wrap gap-5 text-sm font-bold uppercase tracking-wide text-brand-yellow">
          <Link href="/admin/comptes" className="hover:text-white">
            Comptes
          </Link>
          <Link href="/admin/catalogue" className="hover:text-white">
            Catalogue
          </Link>
          <Link href="/admin/remises" className="hover:text-white">
            Remises
          </Link>
          <Link href="/admin/transport" className="hover:text-white">
            Transport
          </Link>
          <Link href="/admin/charte" className="hover:text-white">
            Charte PDF
          </Link>
          <Link href="/admin/devis" className="hover:text-white">
            Devis
          </Link>
        </nav>
        <span className="text-sm text-zinc-300">{session.user.email}</span>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

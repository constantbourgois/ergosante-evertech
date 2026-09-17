import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-brand-black px-6">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-black tracking-tight text-brand-yellow uppercase">
          Devis Tapis Antifatigue
        </h1>
        <p className="text-lg leading-8 text-zinc-300">
          Générez et téléchargez vos devis en autonomie pour la gamme de tapis
          antifatigue et de revêtements de sol ergonomiques EVERMAT.
        </p>
        <div className="flex gap-4">
          <Link
            href="/connexion"
            className="rounded bg-brand-yellow px-5 py-2.5 text-sm font-bold text-brand-black hover:bg-brand-yellow-dark"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="rounded border-2 border-brand-yellow px-5 py-2.5 text-sm font-bold text-brand-yellow hover:bg-brand-yellow/10"
          >
            Créer un compte
          </Link>
        </div>
      </main>
    </div>
  );
}

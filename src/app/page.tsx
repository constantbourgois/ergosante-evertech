import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Devis Tapis Antifatigue
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Générez et téléchargez vos devis en autonomie pour la gamme de tapis
          antifatigue et de revêtements de sol ergonomiques EVERMAT.
        </p>
        <div className="flex gap-4">
          <Link
            href="/connexion"
            className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium dark:border-zinc-700"
          >
            Créer un compte
          </Link>
        </div>
      </main>
    </div>
  );
}

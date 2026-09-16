"use client";

import { Suspense, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  email_not_verified: "Vérifiez votre adresse e-mail avant de vous connecter.",
  not_approved: "Votre compte est en attente d'approbation par un administrateur.",
  account_rejected: "Votre demande d'accès n'a pas été approuvée.",
  too_many_attempts: "Trop de tentatives. Réessayez dans quelques minutes.",
};

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      const code = result.code ?? "invalid_credentials";
      if (code === "email_not_verified") {
        router.push("/verifier-email");
        return;
      }
      if (code === "not_approved") {
        router.push("/en-attente");
        return;
      }
      if (code === "account_rejected") {
        router.push("/compte-refuse");
        return;
      }
      setError(ERROR_MESSAGES[code] ?? "Impossible de se connecter.");
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/tableau-de-bord");
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/inscription" className="font-medium underline">
          Créer un compte
        </Link>
        <Link href="/mot-de-passe-oublie" className="font-medium underline">
          Mot de passe oublié ?
        </Link>
      </div>
    </>
  );
}

export default function ConnexionPage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold">Se connecter</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <ConnexionForm />
      </Suspense>
    </main>
  );
}

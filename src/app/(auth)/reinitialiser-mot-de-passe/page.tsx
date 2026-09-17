"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ReinitialiserMotDePasseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Une erreur est survenue.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/connexion"), 2000);
  }

  if (!token) {
    return <p className="text-zinc-600">Lien invalide.</p>;
  }

  if (done) {
    return <p>Mot de passe mis à jour. Redirection…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nouveau mot de passe (10 caractères minimum)
        <input
          required
          minLength={10}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border-2 border-brand-black px-3 py-2 focus:border-brand-yellow focus:outline-none"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        className="rounded bg-brand-yellow px-4 py-2 font-bold text-brand-black hover:bg-brand-yellow-dark"
      >
        Réinitialiser
      </button>
    </form>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold">Réinitialiser le mot de passe</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <ReinitialiserMotDePasseContent />
      </Suspense>
    </main>
  );
}

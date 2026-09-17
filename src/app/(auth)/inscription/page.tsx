"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function InscriptionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, companyName, phone }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Une erreur est survenue.");
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 px-6 py-24">
        <h1 className="text-2xl font-semibold">Vérifiez votre boîte mail</h1>
        <p className="text-zinc-600">
          Un e-mail de vérification vous a été envoyé. Le lien est valable 24 h.
          Une fois votre adresse vérifiée, votre compte devra encore être
          approuvé par un administrateur avant d&apos;accéder au configurateur.
        </p>
        <Link href="/connexion" className="text-sm font-medium underline">
          Retour à la connexion
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border-2 border-brand-black px-3 py-2 focus:border-brand-yellow focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe (10 caractères minimum)
          <input
            required
            minLength={10}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border-2 border-brand-black px-3 py-2 focus:border-brand-yellow focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Société
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="rounded border-2 border-brand-black px-3 py-2 focus:border-brand-yellow focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Téléphone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded border-2 border-brand-black px-3 py-2 focus:border-brand-yellow focus:outline-none"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded bg-brand-yellow px-4 py-2 font-bold text-brand-black hover:bg-brand-yellow-dark disabled:opacity-50"
        >
          {status === "loading" ? "Envoi…" : "Créer mon compte"}
        </button>
      </form>
      <p className="text-sm text-zinc-600">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}

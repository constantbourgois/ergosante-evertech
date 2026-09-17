"use client";

import { useState, type FormEvent } from "react";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDone(true);
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
      {done ? (
        <p className="text-zinc-600">
          Si un compte existe pour cette adresse, un e-mail de réinitialisation
          vient d&apos;être envoyé.
        </p>
      ) : (
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
          <button
            type="submit"
            className="rounded bg-brand-yellow px-4 py-2 font-bold text-brand-black hover:bg-brand-yellow-dark"
          >
            Envoyer le lien de réinitialisation
          </button>
        </form>
      )}
    </main>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifierEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<"checking" | "success" | "error" | "waiting">(
    token ? "checking" : "waiting",
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setState(res.ok ? "success" : "error"))
      .catch(() => setState("error"));
  }, [token]);

  async function onResend() {
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });
    setResendDone(true);
  }

  if (state === "checking") {
    return <p>Vérification en cours…</p>;
  }

  if (state === "success") {
    return (
      <>
        <h1 className="text-2xl font-semibold">Adresse vérifiée</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Votre compte attend maintenant l&apos;approbation d&apos;un
          administrateur. Vous recevrez un e-mail dès qu&apos;il sera activé.
        </p>
        <Link href="/connexion" className="text-sm font-medium underline">
          Retour à la connexion
        </Link>
      </>
    );
  }

  if (state === "error") {
    return (
      <>
        <h1 className="text-2xl font-semibold">Lien invalide ou expiré</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ce lien de vérification n&apos;est plus valable. Demandez-en un
          nouveau ci-dessous.
        </p>
        {renderResendForm()}
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Vérifiez votre boîte mail</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Un e-mail de vérification vous a été envoyé à l&apos;inscription. Vous
        pouvez en demander un nouveau si besoin.
      </p>
      {renderResendForm()}
    </>
  );

  function renderResendForm() {
    if (resendDone) {
      return <p className="text-sm text-zinc-600 dark:text-zinc-400">Si un compte existe pour cette adresse, un e-mail a été envoyé.</p>;
    }
    return (
      <div className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Votre e-mail"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          onClick={onResend}
          className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          Renvoyer l&apos;e-mail de vérification
        </button>
      </div>
    );
  }
}

export default function VerifierEmailPage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 px-6 py-24">
      <Suspense fallback={<p>Chargement…</p>}>
        <VerifierEmailContent />
      </Suspense>
    </main>
  );
}

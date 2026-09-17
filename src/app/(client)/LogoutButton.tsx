"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ redirectUrl: "/connexion" })}
      className="text-sm font-bold uppercase tracking-wide text-zinc-300 hover:text-brand-yellow"
    >
      Déconnexion
    </button>
  );
}

import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "./password";
import { edgeAuthConfig } from "./edge-config";
import { checkRateLimit } from "./rate-limit";

class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}
class NotApprovedError extends CredentialsSignin {
  code = "not_approved";
}
class AccountRejectedError extends CredentialsSignin {
  code = "account_rejected";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...edgeAuthConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) throw new InvalidCredentialsError();

        // Limitation de débit sur la connexion — docs/PLAN.md §10. Par
        // compte plutôt que par IP : un attaquant distribué sur plusieurs IP
        // reste borné sur le compte visé.
        const { allowed } = checkRateLimit(`login:${email}`, 10, 15 * 60 * 1000);
        if (!allowed) throw new TooManyAttemptsError();

        const user = await db.user.findUnique({ where: { email } });
        if (!user) throw new InvalidCredentialsError();

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) throw new InvalidCredentialsError();

        // Double barrière d'accès — docs/PLAN.md §10 : un compte vérifié
        // mais non approuvé ne doit voir aucun prix, donc ne doit pas
        // ouvrir de session applicative au-delà de l'écran d'attente.
        if (user.rejectedAt) throw new AccountRejectedError();
        if (!user.emailVerifiedAt) throw new EmailNotVerifiedError();
        if (!user.approvedAt) throw new NotApprovedError();

        // Sert de base à la politique de rétention RGPD (compte inactif
        // alerté à 2 ans, supprimé à 3 ans) — docs/QUESTIONS-OUVERTES.md §5.6.
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
        };
      },
    }),
  ],
});

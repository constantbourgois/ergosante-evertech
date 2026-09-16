import type { NextAuthConfig } from "next-auth";

// Configuration compatible edge runtime : ni Prisma ni bcrypt, seulement les
// callbacks JWT/session. Utilisée par le middleware ; la configuration
// complète (avec le provider Credentials, qui a besoin de la base) est dans
// ./config.ts et ne s'exécute qu'en runtime Node — docs/PLAN.md §9.1, le
// pilote Postgres ne tourne pas sur l'edge.
export const edgeAuthConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyName = user.companyName ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "CLIENT" | "ADMIN";
        session.user.companyName = (token.companyName as string | null) ?? null;
      }
      return session;
    },
  },
};

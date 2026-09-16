import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    companyName: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      companyName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    companyName: string | null;
  }
}

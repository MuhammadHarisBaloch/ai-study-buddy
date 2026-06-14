import type { DefaultSession } from "next-auth";

// Tell TypeScript that session.user has an `id` (we add it in the session callback
// in app/lib/auth.ts). Without this, `session.user.id` would be a type error.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

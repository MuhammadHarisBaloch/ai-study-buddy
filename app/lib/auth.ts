import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";

// NextAuth v5 config. Exports the helpers we use everywhere:
//   handlers -> the GET/POST route handlers for /api/auth/*
//   auth     -> read the current session on the server (server components & routes)
//   signIn / signOut -> call from server actions / buttons
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Store users/sessions in our Postgres via Prisma (database sessions).
  adapter: PrismaAdapter(prisma),

  // Google sign-in. Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the environment automatically.
  providers: [Google],

  // Store each login as a row in our Session table (not a JWT cookie). This makes the
  // `user` argument available in the session callback below, so we can attach user.id.
  session: { strategy: "database" },

  // Trust the incoming host header (needed behind a proxy and on deploy, e.g. Vercel).
  trustHost: true,

  callbacks: {
    // With database sessions the callback receives the DB `user`. Copy its id onto
    // session.user so server code can do `session.user.id` to scope data per user.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

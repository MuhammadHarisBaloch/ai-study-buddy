// The catch-all auth endpoint. NextAuth gives us the GET/POST handlers; we just
// re-export them. This is what /api/auth/signin, /api/auth/callback/google, etc. hit.
import { handlers } from "@/app/lib/auth";

// Next 16 otherwise tries to statically generate this catch-all at build time,
// which crashes the static-generation worker ("Failed to generate static paths")
// and makes every /api/auth/* request return a 500 HTML page instead of JSON.
// Auth endpoints depend on the request (cookies, query, headers), so force dynamic.
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;

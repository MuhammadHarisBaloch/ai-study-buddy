import { signIn } from "@/app/lib/auth";
import SignInButton from "@/app/components/SignInButton";

// Marketing landing page shown to logged-out visitors. Server component:
// the "Sign in with Google" button is a server action (same pattern as the app).
export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Soft gradient backdrop accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet/20 blur-[120px]" />
        <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-brand-soft/20 blur-[120px]" />
      </div>

      {/* Top nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-lg font-bold text-ink">
          AI Study&nbsp;Buddy
        </span>
        <span className="text-sm text-muted">Powered by Gemini</span>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16 text-center sm:pt-24">
        <p
          className="animate-fade-up text-sm font-semibold uppercase tracking-widest text-brand"
          style={{ animationDelay: "0ms" }}
        >
          Study smarter, not harder
        </p>

        <h1
          className="animate-fade-up mt-4 font-display text-5xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          Turn your notes into a{" "}
          <span className="bg-gradient-to-r from-brand-soft to-violet bg-clip-text text-transparent">
            study partner
          </span>
        </h1>

        <p
          className="animate-fade-up mx-auto mt-6 max-w-xl text-lg text-ink-soft"
          style={{ animationDelay: "160ms" }}
        >
          Upload your course notes, then chat with them, generate quizzes, and
          get instant summaries — all grounded in your own material, so the
          answers actually match what you study.
        </p>

        <div
          className="animate-fade-up mt-10 flex justify-center"
          style={{ animationDelay: "240ms" }}
        >
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <SignInButton />
          </form>
        </div>

        <p
          className="animate-fade-up mt-4 text-xs text-muted"
          style={{ animationDelay: "300ms" }}
        >
          Free to try · Your notes stay private to your account
        </p>

        {/* How it works */}
        <div className="mt-24 grid gap-5 sm:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up rounded-2xl border border-border bg-surface p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const features = [
  {
    title: "Upload your notes",
    body: "Drop in a PDF of your lecture notes or textbook chapter. We read and index it for you.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4m0 0L8 8m4-4 4 4" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  },
  {
    title: "Ask questions",
    body: "Chat with your notes and get clear, grounded answers — not made-up ones.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Quiz yourself",
    body: "Generate multiple-choice quizzes and concise summaries to lock in what you learn.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

import { auth } from "@/app/lib/auth";
import Landing from "@/app/components/Landing";
import StudyApp from "@/app/components/StudyApp";

// Server component: decides which experience to render based on the session.
export default async function Home() {
  const session = await auth();

  // Logged out → marketing landing page.
  if (!session?.user) {
    return <Landing />;
  }

  // Logged in → the study app shell.
  return (
    <StudyApp
      userName={session.user.name ?? session.user.email ?? "You"}
      userImage={session.user.image ?? null}
    />
  );
}

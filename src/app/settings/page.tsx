import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { ProfileEditor } from "@/components/profile-editor";
import { ChevronLeftIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="space-y-6 py-2">
      <header className="flex items-center gap-2">
        <Link
          href={`/u/${user.handle}`}
          aria-label="Back to profile"
          className="-ml-1 rounded-full p-1 text-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <ProfileEditor
        initial={{
          handle: user.handle,
          name: user.name,
          imageUrl: user.imageUrl,
        }}
      />

      <div>
        <Link
          href="/onboarding"
          className="text-sm font-medium text-accent"
        >
          Edit your categories →
        </Link>
      </div>
    </div>
  );
}

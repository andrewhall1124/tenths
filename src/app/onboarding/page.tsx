import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getCategoriesWithMembership } from "@/lib/queries";
import { ProfileEditor } from "@/components/profile-editor";
import { CategoryPicker } from "./category-picker";

export default async function OnboardingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/");

  const categories = await getCategoriesWithMembership(user.id);
  const alreadyOnboarded = !!user.onboardedAt;

  return (
    <div className="space-y-8 py-6">
      {!alreadyOnboarded && (
        <section className="space-y-4">
          <header className="text-center">
            <h1 className="text-2xl font-bold">Set up your profile</h1>
            <p className="mt-1 text-sm text-muted">
              Pick a username and a photo. You can change these anytime.
            </p>
          </header>
          <ProfileEditor
            initial={{
              handle: user.handle,
              name: user.name,
              imageUrl: user.imageUrl,
            }}
          />
        </section>
      )}

      <section className="space-y-4">
        <header className="text-center">
          <h2 className="text-2xl font-bold">What do you love?</h2>
          <p className="mt-1 text-sm text-muted">
            Pick the categories you want to rate. You can change these anytime.
          </p>
        </header>
        <CategoryPicker
          categories={categories}
          alreadyOnboarded={alreadyOnboarded}
        />
      </section>
    </div>
  );
}

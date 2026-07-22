import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";
import { getCategoriesWithMembership } from "@/lib/queries";
import { CategoryPicker } from "./category-picker";

export default async function OnboardingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/");

  const categories = await getCategoriesWithMembership(user.id);

  return (
    <div className="space-y-6 py-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">What do you love?</h1>
        <p className="mt-1 text-sm text-muted">
          Pick the categories you want to rate. You can change these anytime.
        </p>
      </header>
      <CategoryPicker
        categories={categories}
        alreadyOnboarded={!!user.onboardedAt}
      />
    </div>
  );
}

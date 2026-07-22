import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth";

export default async function MePage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardedAt) redirect("/onboarding");
  redirect(`/u/${user.handle}`);
}

import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

function slugifyHandle(base: string): string {
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return cleaned || "taster";
}

async function uniqueHandle(base: string): Promise<string> {
  const root = slugifyHandle(base);
  let candidate = root;
  let n = 0;
  // Probe until we find a free handle.
  while (true) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.handle, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
    n += 1;
    candidate = `${root}${n}`;
  }
}

/**
 * Ensure the signed-in Clerk user has a row in our users table.
 * Returns null when there is no authenticated user. Deduped per request via
 * React cache() so the layout and page share a single lookup.
 */
export const getOrCreateUser = cache(async (): Promise<User | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing.length > 0) return existing[0];

  const clerk = await currentUser();
  const base =
    clerk?.username ||
    clerk?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    clerk?.firstName ||
    userId.slice(-8);
  const handle = await uniqueHandle(base);
  const name =
    [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ") ||
    clerk?.username ||
    null;

  const inserted = await db
    .insert(users)
    .values({
      id: userId,
      handle,
      name,
      imageUrl: clerk?.imageUrl ?? null,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted.length > 0) return inserted[0];

  // Race: another request created it first.
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0] ?? null;
});

/** Like getOrCreateUser but throws when unauthenticated. */
export async function requireUser(): Promise<User> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

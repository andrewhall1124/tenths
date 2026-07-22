"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  categories,
  follows,
  places,
  ratings,
  userCategories,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { normalizeScore } from "@/lib/score";

const ratingSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  existingPlaceId: z.coerce.number().int().positive().optional(),
  googlePlaceId: z.string().min(1).optional(),
  name: z.string().min(1).max(120).optional(),
  address: z.string().max(300).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  score: z.coerce.number().min(0).max(10),
  note: z.string().max(500).optional(),
});

/** Resolve the target place, creating or deduping it as needed. */
async function resolvePlace(
  input: z.infer<typeof ratingSchema>,
  userId: string,
): Promise<number> {
  if (input.existingPlaceId) return input.existingPlaceId;

  // Dedupe on (googlePlaceId, category) when we have a Google id.
  if (input.googlePlaceId) {
    const existing = await db
      .select({ id: places.id })
      .from(places)
      .where(
        and(
          eq(places.googlePlaceId, input.googlePlaceId),
          eq(places.categoryId, input.categoryId),
        ),
      )
      .limit(1);
    if (existing.length > 0) return existing[0].id;
  }

  if (!input.name) throw new Error("A place name is required");

  const inserted = await db
    .insert(places)
    .values({
      categoryId: input.categoryId,
      name: input.name,
      googlePlaceId: input.googlePlaceId ?? null,
      address: input.address ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      createdBy: userId,
    })
    .onConflictDoNothing({
      target: [places.googlePlaceId, places.categoryId],
    })
    .returning({ id: places.id });

  if (inserted.length > 0) return inserted[0].id;

  // Conflict raced us — fetch the winner.
  const row = await db
    .select({ id: places.id })
    .from(places)
    .where(
      and(
        eq(places.googlePlaceId, input.googlePlaceId!),
        eq(places.categoryId, input.categoryId),
      ),
    )
    .limit(1);
  return row[0].id;
}

export async function saveRating(formData: FormData) {
  const user = await requireUser();
  const input = ratingSchema.parse(Object.fromEntries(formData.entries()));
  const score = normalizeScore(input.score);
  const placeId = await resolvePlace(input, user.id);

  await db
    .insert(ratings)
    .values({
      userId: user.id,
      placeId,
      score,
      note: input.note?.trim() || null,
    })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.placeId],
      set: { score, note: input.note?.trim() || null, updatedAt: new Date() },
    });

  revalidatePath("/");
  revalidatePath(`/place/${placeId}`);
  revalidatePath(`/u/${user.handle}`);
  return { placeId };
}

export async function toggleCategory(categoryId: number, on: boolean) {
  const user = await requireUser();
  if (on) {
    await db
      .insert(userCategories)
      .values({ userId: user.id, categoryId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(userCategories)
      .where(
        and(
          eq(userCategories.userId, user.id),
          eq(userCategories.categoryId, categoryId),
        ),
      );
  }
  revalidatePath("/onboarding");
  revalidatePath("/");
}

export async function completeOnboarding() {
  const user = await requireUser();
  await db
    .update(users)
    .set({ onboardedAt: new Date() })
    .where(eq(users.id, user.id));
  revalidatePath("/");
}

export async function toggleFollow(followeeId: string) {
  const user = await requireUser();
  if (followeeId === user.id) return;
  const existing = await db
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, user.id),
        eq(follows.followeeId, followeeId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, user.id),
          eq(follows.followeeId, followeeId),
        ),
      );
  } else {
    await db.insert(follows).values({
      followerId: user.id,
      followeeId,
    });
  }
  revalidatePath("/");
}

// Category id lookup by slug, used by the rate flow.
export async function getCategoryBySlug(slug: string) {
  const row = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row[0] ?? null;
}

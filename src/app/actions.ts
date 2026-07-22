"use server";

import { and, eq, ne } from "drizzle-orm";
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
  date: z.coerce.date().optional(),
  // A downscaled JPEG data URL (or empty string to clear). ~2MB ceiling.
  photoUrl: z.string().max(2_000_000).optional(),
});

function cleanPhoto(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return v.startsWith("data:image/") || v.startsWith("https://") ? v : null;
}

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
  const note = input.note?.trim() || null;
  const createdAt = input.date ?? new Date();
  const photoUrl = cleanPhoto(input.photoUrl);

  await db
    .insert(ratings)
    .values({
      userId: user.id,
      placeId,
      score,
      note,
      createdAt,
      photoUrl,
    })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.placeId],
      set: {
        score,
        note,
        createdAt,
        updatedAt: new Date(),
        ...(input.photoUrl !== undefined ? { photoUrl } : {}),
      },
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

const updateRatingSchema = ratingSchema.extend({
  ratingId: z.coerce.number().int().positive(),
});

/**
 * Edit an existing rating the caller owns: score, note, date, and — by
 * re-resolving the place — its category and location too. Moving a rating onto
 * a place the user already rated merges into that rating (one per place).
 */
export async function updateRating(formData: FormData) {
  const user = await requireUser();
  const input = updateRatingSchema.parse(Object.fromEntries(formData.entries()));

  const existing = await db
    .select({ placeId: ratings.placeId, userId: ratings.userId })
    .from(ratings)
    .where(eq(ratings.id, input.ratingId))
    .limit(1);
  const row = existing[0];
  if (!row || row.userId !== user.id) throw new Error("Rating not found");

  const targetPlaceId = await resolvePlace(input, user.id);
  const fields = {
    score: normalizeScore(input.score),
    note: input.note?.trim() || null,
    ...(input.date ? { createdAt: input.date } : {}),
    ...(input.photoUrl !== undefined
      ? { photoUrl: cleanPhoto(input.photoUrl) }
      : {}),
    updatedAt: new Date(),
  };

  if (targetPlaceId === row.placeId) {
    await db.update(ratings).set(fields).where(eq(ratings.id, input.ratingId));
  } else {
    // Repointing to a different place: if the user already rated it, fold this
    // edit into that rating and drop the current one; otherwise just move it.
    const dup = await db
      .select({ id: ratings.id })
      .from(ratings)
      .where(and(eq(ratings.userId, user.id), eq(ratings.placeId, targetPlaceId)))
      .limit(1);

    if (dup[0] && dup[0].id !== input.ratingId) {
      await db.update(ratings).set(fields).where(eq(ratings.id, dup[0].id));
      await db.delete(ratings).where(eq(ratings.id, input.ratingId));
    } else {
      await db
        .update(ratings)
        .set({ placeId: targetPlaceId, ...fields })
        .where(eq(ratings.id, input.ratingId));
    }
  }

  revalidatePath("/");
  revalidatePath(`/place/${row.placeId}`);
  revalidatePath(`/place/${targetPlaceId}`);
  revalidatePath(`/u/${user.handle}`);
  return { placeId: targetPlaceId };
}

/** Delete a rating the caller owns. */
export async function deleteRating(ratingId: number) {
  const user = await requireUser();
  const existing = await db
    .select({ placeId: ratings.placeId, userId: ratings.userId })
    .from(ratings)
    .where(eq(ratings.id, ratingId))
    .limit(1);
  const row = existing[0];
  if (!row || row.userId !== user.id) throw new Error("Rating not found");

  await db.delete(ratings).where(eq(ratings.id, ratingId));

  revalidatePath("/");
  revalidatePath(`/place/${row.placeId}`);
  revalidatePath(`/u/${user.handle}`);
  return { placeId: row.placeId };
}

const profileSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_]{3,20}$/,
      "Use 3–20 letters, numbers, or underscores",
    ),
  name: z.string().trim().max(60).nullish(),
  // Either an https URL or a small inline data URL (client-resized avatar).
  imageUrl: z.string().max(600_000).nullish(),
});

export type ProfileUpdate = z.input<typeof profileSchema>;

/** Update the caller's username, display name, and avatar. */
export async function updateProfile(
  input: ProfileUpdate,
): Promise<{ ok: true; handle: string } | { error: string }> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  }
  const { handle, name } = parsed.data;
  const imageUrl = parsed.data.imageUrl;

  if (
    imageUrl &&
    !imageUrl.startsWith("https://") &&
    !imageUrl.startsWith("data:image/")
  ) {
    return { error: "Invalid image" };
  }

  const clash = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.handle, handle), ne(users.id, user.id)))
    .limit(1);
  if (clash.length > 0) return { error: "That username is taken" };

  await db
    .update(users)
    .set({
      handle,
      name: name || null,
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/");
  revalidatePath(`/u/${handle}`);
  if (handle !== user.handle) revalidatePath(`/u/${user.handle}`);
  return { ok: true, handle };
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

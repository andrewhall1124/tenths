import { and, avg, count, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  follows,
  places,
  ratings,
  userCategories,
  users,
} from "@/db/schema";

export type FeedItem = {
  ratingId: number;
  score: number;
  note: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  placeId: number;
  placeName: string;
  placeAddress: string | null;
  categorySlug: string;
  categoryName: string;
  categoryEmoji: string;
  userId: string;
  handle: string;
  userName: string | null;
  userImage: string | null;
};

const feedColumns = {
  ratingId: ratings.id,
  score: ratings.score,
  note: ratings.note,
  photoUrl: ratings.photoUrl,
  createdAt: ratings.createdAt,
  updatedAt: ratings.updatedAt,
  placeId: places.id,
  placeName: places.name,
  placeAddress: places.address,
  categorySlug: categories.slug,
  categoryName: categories.name,
  categoryEmoji: categories.emoji,
  userId: users.id,
  handle: users.handle,
  userName: users.name,
  userImage: users.imageUrl,
};

function baseFeedQuery() {
  return db
    .select(feedColumns)
    .from(ratings)
    .innerJoin(places, eq(ratings.placeId, places.id))
    .innerJoin(categories, eq(places.categoryId, categories.id))
    .innerJoin(users, eq(ratings.userId, users.id));
}

/** Recent ratings from people the user follows, plus their own. */
export async function getFollowingFeed(
  userId: string,
  limit = 40,
): Promise<FeedItem[]> {
  const following = await db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(eq(follows.followerId, userId));
  const ids = [userId, ...following.map((f) => f.id)];

  return baseFeedQuery()
    .where(inArray(ratings.userId, ids))
    .orderBy(desc(ratings.updatedAt))
    .limit(limit);
}

/** Recent ratings across everyone — used for discovery / cold start. */
export async function getGlobalFeed(limit = 40): Promise<FeedItem[]> {
  return baseFeedQuery().orderBy(desc(ratings.updatedAt)).limit(limit);
}

export type MapPlace = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  categorySlug: string;
  categoryName: string;
  categoryEmoji: string;
  avgScore: number | null;
  ratingCount: number;
};

/** Every place that has coordinates, with its average score — for the map. */
export async function getMapPlaces(): Promise<MapPlace[]> {
  const rows = await db
    .select({
      id: places.id,
      name: places.name,
      lat: places.lat,
      lng: places.lng,
      categorySlug: categories.slug,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      avgScore: avg(ratings.score),
      ratingCount: count(ratings.id),
    })
    .from(places)
    .innerJoin(categories, eq(places.categoryId, categories.id))
    .leftJoin(ratings, eq(ratings.placeId, places.id))
    .where(and(isNotNull(places.lat), isNotNull(places.lng)))
    .groupBy(places.id, categories.id);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    lat: r.lat as number,
    lng: r.lng as number,
    categorySlug: r.categorySlug,
    categoryName: r.categoryName,
    categoryEmoji: r.categoryEmoji,
    avgScore: r.avgScore != null ? Number(r.avgScore) : null,
    ratingCount: Number(r.ratingCount),
  }));
}

export type PlaceDetail = {
  id: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  categorySlug: string;
  categoryName: string;
  categoryEmoji: string;
  avgScore: number | null;
  ratingCount: number;
};

export async function getPlace(placeId: number): Promise<PlaceDetail | null> {
  const rows = await db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      lat: places.lat,
      lng: places.lng,
      categorySlug: categories.slug,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      avgScore: avg(ratings.score),
      ratingCount: count(ratings.id),
    })
    .from(places)
    .innerJoin(categories, eq(places.categoryId, categories.id))
    .leftJoin(ratings, eq(ratings.placeId, places.id))
    .where(eq(places.id, placeId))
    .groupBy(places.id, categories.id)
    .limit(1);

  const r = rows[0];
  if (!r) return null;
  return {
    ...r,
    avgScore: r.avgScore != null ? Number(r.avgScore) : null,
    ratingCount: Number(r.ratingCount),
  };
}

export type PlaceRating = {
  ratingId: number;
  score: number;
  note: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  handle: string;
  userName: string | null;
  userImage: string | null;
};

export async function getPlaceRatings(
  placeId: number,
): Promise<PlaceRating[]> {
  return db
    .select({
      ratingId: ratings.id,
      score: ratings.score,
      note: ratings.note,
      photoUrl: ratings.photoUrl,
      createdAt: ratings.createdAt,
      updatedAt: ratings.updatedAt,
      userId: users.id,
      handle: users.handle,
      userName: users.name,
      userImage: users.imageUrl,
    })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(eq(ratings.placeId, placeId))
    .orderBy(desc(ratings.updatedAt));
}

export type EditableRating = {
  ratingId: number;
  score: number;
  note: string | null;
  photoUrl: string | null;
  createdAt: Date;
  placeId: number;
  placeName: string;
  placeAddress: string | null;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
};

/** Load a rating for editing, scoped to its owner. */
export async function getRatingForEdit(
  ratingId: number,
  userId: string,
): Promise<EditableRating | null> {
  const rows = await db
    .select({
      ratingId: ratings.id,
      score: ratings.score,
      note: ratings.note,
      photoUrl: ratings.photoUrl,
      createdAt: ratings.createdAt,
      placeId: places.id,
      placeName: places.name,
      placeAddress: places.address,
      categoryId: categories.id,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(ratings)
    .innerJoin(places, eq(ratings.placeId, places.id))
    .innerJoin(categories, eq(places.categoryId, categories.id))
    .where(and(eq(ratings.id, ratingId), eq(ratings.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** A single user's rating for a place, if any. */
export async function getUserRatingForPlace(userId: string, placeId: number) {
  const row = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.placeId, placeId)))
    .limit(1);
  return row[0] ?? null;
}

export type ProfileData = {
  user: { id: string; handle: string; name: string | null; imageUrl: string | null };
  categories: { slug: string; name: string; emoji: string; count: number }[];
  ratings: FeedItem[];
  ratingCount: number;
  followerCount: number;
  followingCount: number;
};

export async function getProfileByHandle(
  handle: string,
): Promise<ProfileData | null> {
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);
  const user = userRow[0];
  if (!user) return null;

  const ratingRows = await baseFeedQuery()
    .where(eq(ratings.userId, user.id))
    .orderBy(desc(ratings.updatedAt))
    .limit(200);

  // Aggregate the user's ratings into per-category tiles.
  const byCat = new Map<
    string,
    { slug: string; name: string; emoji: string; count: number }
  >();
  for (const r of ratingRows) {
    const key = r.categorySlug;
    const cur = byCat.get(key);
    if (cur) cur.count += 1;
    else
      byCat.set(key, {
        slug: r.categorySlug,
        name: r.categoryName,
        emoji: r.categoryEmoji,
        count: 1,
      });
  }

  const [followerRow, followingRow] = await Promise.all([
    db
      .select({ c: count() })
      .from(follows)
      .where(eq(follows.followeeId, user.id)),
    db
      .select({ c: count() })
      .from(follows)
      .where(eq(follows.followerId, user.id)),
  ]);

  return {
    user: {
      id: user.id,
      handle: user.handle,
      name: user.name,
      imageUrl: user.imageUrl,
    },
    categories: [...byCat.values()].sort((a, b) => b.count - a.count),
    ratings: ratingRows,
    ratingCount: ratingRows.length,
    followerCount: Number(followerRow[0]?.c ?? 0),
    followingCount: Number(followingRow[0]?.c ?? 0),
  };
}

export async function isFollowing(
  followerId: string,
  followeeId: string,
): Promise<boolean> {
  const row = await db
    .select({ f: follows.followerId })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followeeId, followeeId),
      ),
    )
    .limit(1);
  return row.length > 0;
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(categories.sortOrder);
}

/** Categories with a flag for whether the user has added them to their palate. */
export async function getCategoriesWithMembership(userId: string) {
  const all = await getAllCategories();
  const mine = await db
    .select({ id: userCategories.categoryId })
    .from(userCategories)
    .where(eq(userCategories.userId, userId));
  const mineSet = new Set(mine.map((m) => m.id));
  return all.map((c) => ({ ...c, selected: mineSet.has(c.id) }));
}

export type LeaderboardEntry = {
  placeId: number;
  name: string;
  address: string | null;
  avgScore: number;
  ratingCount: number;
};

/** Top-rated places in a category (min 1 rating), highest average first. */
export async function getCategoryLeaderboard(
  categorySlug: string,
  limit = 25,
): Promise<{ category: { slug: string; name: string; emoji: string } | null; entries: LeaderboardEntry[] }> {
  const catRow = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);
  const category = catRow[0];
  if (!category) return { category: null, entries: [] };

  const rows = await db
    .select({
      placeId: places.id,
      name: places.name,
      address: places.address,
      avgScore: avg(ratings.score),
      ratingCount: count(ratings.id),
    })
    .from(places)
    .innerJoin(ratings, eq(ratings.placeId, places.id))
    .where(eq(places.categoryId, category.id))
    .groupBy(places.id)
    .orderBy(desc(sql`avg(${ratings.score})`))
    .limit(limit);

  return {
    category: {
      slug: category.slug,
      name: category.name,
      emoji: category.emoji,
    },
    entries: rows.map((r) => ({
      placeId: r.placeId,
      name: r.name,
      address: r.address,
      avgScore: Number(r.avgScore),
      ratingCount: Number(r.ratingCount),
    })),
  };
}

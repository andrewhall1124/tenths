import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  doublePrecision,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users mirror Clerk accounts. `id` is the Clerk user id.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  onboardedAt: timestamp("onboarded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Curated global taste categories (pizza, bagels, sushi, matcha, ...).
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Categories a user has added to their palate.
export const userCategories = pgTable(
  "user_categories",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.categoryId] })],
);

// A rateable place within a category. Deduped on googlePlaceId when present.
export const places = pgTable(
  "places",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    googlePlaceId: text("google_place_id"),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("places_google_place_category").on(t.googlePlaceId, t.categoryId),
    index("places_category_idx").on(t.categoryId),
  ],
);

// One score per user per place (editable), on a 0.0–10.0 scale.
export const ratings = pgTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    note: text("note"),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("ratings_user_place").on(t.userId, t.placeId),
    index("ratings_place_idx").on(t.placeId),
    index("ratings_user_idx").on(t.userId),
  ],
);

// Directed social graph: follower -> followee.
export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followeeId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  categories: many(userCategories),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  places: many(places),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  category: one(categories, {
    fields: [places.categoryId],
    references: [categories.id],
  }),
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  place: one(places, { fields: [ratings.placeId], references: [places.id] }),
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Place = typeof places.$inferSelect;
export type Rating = typeof ratings.$inferSelect;

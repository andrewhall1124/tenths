import { db } from "./index";
import { categories } from "./schema";

// Curated starter categories. Users pick from these on onboarding.
const SEED_CATEGORIES = [
  { slug: "pizza", name: "Pizza", emoji: "🍕", sortOrder: 10 },
  { slug: "bagels", name: "Bagels", emoji: "🥯", sortOrder: 20 },
  { slug: "sushi", name: "Sushi", emoji: "🍣", sortOrder: 30 },
  { slug: "matcha", name: "Matcha", emoji: "🍵", sortOrder: 40 },
  { slug: "coffee", name: "Coffee", emoji: "☕", sortOrder: 50 },
  { slug: "burgers", name: "Burgers", emoji: "🍔", sortOrder: 60 },
  { slug: "tacos", name: "Tacos", emoji: "🌮", sortOrder: 70 },
  { slug: "ramen", name: "Ramen", emoji: "🍜", sortOrder: 80 },
  { slug: "ice-cream", name: "Ice Cream", emoji: "🍦", sortOrder: 90 },
  { slug: "cocktails", name: "Cocktails", emoji: "🍸", sortOrder: 100 },
  { slug: "wings", name: "Wings", emoji: "🍗", sortOrder: 110 },
  { slug: "donuts", name: "Donuts", emoji: "🍩", sortOrder: 120 },
];

async function main() {
  console.log("Seeding categories...");
  for (const c of SEED_CATEGORIES) {
    await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: c.name, emoji: c.emoji, sortOrder: c.sortOrder },
      });
  }
  console.log(`Seeded ${SEED_CATEGORIES.length} categories.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

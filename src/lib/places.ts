// Thin wrapper over the Google Places API (New). Degrades gracefully to an
// empty result set when no API key is configured, so the app runs without it
// and users fall back to manual place entry.

export type PlaceSuggestion = {
  googlePlaceId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const q = query.trim();
  if (!key || q.length < 2) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: q, maxResultCount: 8 }),
    // Places responses are stable enough to cache briefly.
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  const data = (await res.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    }>;
  };

  return (data.places ?? []).map((p) => ({
    googlePlaceId: p.id,
    name: p.displayName?.text ?? "Unknown place",
    address: p.formattedAddress ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
  }));
}

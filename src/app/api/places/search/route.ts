import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchPlaces } from "@/lib/places";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ suggestions: [] }, { status: 401 });
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const suggestions = await searchPlaces(q);
  return NextResponse.json({ suggestions });
}

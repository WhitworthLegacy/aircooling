import { FALLBACK_REVIEWS } from "@/lib/reviews";

export async function GET() {
  // Return fallback reviews
  // Future: integrate with Google Places API using GOOGLE_PLACES_API_KEY
  return Response.json({
    reviews: FALLBACK_REVIEWS.slice(0, 3),
    source: "fallback",
    averageRating: "4.9",
    totalRatings: 77,
  });
}

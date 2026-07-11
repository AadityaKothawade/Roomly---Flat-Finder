// Deterministic fallback used when the Gemini call fails or returns
// malformed output. Keeps the app functional and the score explainable
// even with the LLM unavailable.
//
// Scoring: up to 50 points for location match, up to 50 points for how much
// the listing's rent overlaps the tenant's budget range.
export function ruleBasedScore(listing, tenantProfile) {
  let locationPoints = 0;
  const listingLoc = (listing.location || "").toLowerCase().trim();
  const prefLoc = (tenantProfile.preferred_location || "").toLowerCase().trim();

  if (listingLoc && prefLoc) {
    if (listingLoc === prefLoc) {
      locationPoints = 50;
    } else if (listingLoc.includes(prefLoc) || prefLoc.includes(listingLoc)) {
      locationPoints = 35;
    } else {
      locationPoints = 10;
    }
  }

  let budgetPoints = 0;
  const rent = Number(listing.rent);
  const min = Number(tenantProfile.budget_min);
  const max = Number(tenantProfile.budget_max);

  if (!Number.isNaN(rent) && !Number.isNaN(min) && !Number.isNaN(max) && max > min) {
    if (rent >= min && rent <= max) {
      budgetPoints = 50;
    } else {
      const distance = rent < min ? min - rent : rent - max;
      const range = max - min;
      const penalty = Math.min(1, distance / range);
      budgetPoints = Math.round(50 * (1 - penalty));
      budgetPoints = Math.max(0, budgetPoints);
    }
  }

  const score = Math.round(locationPoints + budgetPoints);

  return {
    score: Math.max(0, Math.min(100, score)),
    explanation:
      `Rule-based fallback (LLM unavailable): location match contributed ${locationPoints}/50 points, ` +
      `budget overlap contributed ${budgetPoints}/50 points.`,
    source: "fallback",
  };
}

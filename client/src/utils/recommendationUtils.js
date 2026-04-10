const normalizeNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getDeterministicRecommendationScore = (skill) => {
  const rating = normalizeNumber(skill?.offering?.rating || skill?.user?.rating?.average);
  const sessions = normalizeNumber(skill?.offering?.sessions || skill?.user?.totalSessions);
  const price = normalizeNumber(skill?.offering?.price);
  const freeBonus = price === 0 ? 16 : Math.max(0, 12 - price / 250);
  const ratingWeight = rating * 14;
  const sessionWeight = Math.min(18, Math.log10(sessions + 1) * 10);

  return Math.max(35, Math.min(98, Math.round(ratingWeight + sessionWeight + freeBonus)));
};

export const buildFallbackRecommendations = (skills = []) =>
  [...skills]
    .map((skill) => ({
      ...skill,
      recommendationScore: getDeterministicRecommendationScore(skill),
      recommendationReason:
        normalizeNumber(skill?.offering?.price) === 0
          ? 'priceCompatibility'
          : normalizeNumber(skill?.offering?.rating || skill?.user?.rating?.average) >= 4.5
            ? 'instructorQuality'
            : normalizeNumber(skill?.offering?.sessions || skill?.user?.totalSessions) >= 10
              ? 'socialProof'
              : 'categoryAffinity',
    }))
    .sort((left, right) => right.recommendationScore - left.recommendationScore);

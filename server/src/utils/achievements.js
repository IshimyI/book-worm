// Purely derived from existing counters — no dedicated table, nothing to
// unlock/persist. Each category has three thresholds (bronze/silver/gold);
// a badge shows whichever tier the current value has reached, plus the
// count needed to reach the next one.
const TIERS = [
  { key: "bronze", name: "Бронза", icon: "🥉" },
  { key: "silver", name: "Серебро", icon: "🥈" },
  { key: "gold", name: "Золото", icon: "🥇" },
];

const CATEGORIES = [
  { id: "reviewer", label: "Рецензент", icon: "📝", stat: "reviewCount", thresholds: [1, 10, 25] },
  { id: "reader", label: "Читатель", icon: "📚", stat: "booksReadCount", thresholds: [1, 10, 25] },
  { id: "quotes", label: "Коллекционер цитат", icon: "💬", stat: "quotesCount", thresholds: [1, 5, 15] },
  { id: "popularity", label: "Популярность", icon: "⭐", stat: "followerCount", thresholds: [1, 5, 20] },
  { id: "helpfulness", label: "Полезные советы", icon: "👍", stat: "helpfulReceivedCount", thresholds: [1, 10, 30] },
];

function computeAchievements(stats) {
  return CATEGORIES.map((category) => {
    const value = stats[category.stat] || 0;
    let tierIndex = -1;
    for (let i = category.thresholds.length - 1; i >= 0; i--) {
      if (value >= category.thresholds[i]) {
        tierIndex = i;
        break;
      }
    }
    const reachedTier = tierIndex >= 0 ? TIERS[tierIndex] : null;
    const nextThreshold = tierIndex + 1 < category.thresholds.length ? category.thresholds[tierIndex + 1] : null;

    return {
      id: category.id,
      label: category.label,
      icon: category.icon,
      achieved: reachedTier !== null,
      tier: reachedTier?.key || null,
      tierName: reachedTier?.name || null,
      tierIcon: reachedTier?.icon || null,
      progress: value,
      goal: nextThreshold ?? category.thresholds[category.thresholds.length - 1],
      isMaxTier: tierIndex === category.thresholds.length - 1,
    };
  });
}

module.exports = { computeAchievements };

// Purely derived from existing counters — no dedicated table, nothing to
// unlock/persist. A badge is just "does this stat clear this threshold?"
// evaluated fresh on every profile load.
const ACHIEVEMENTS = [
  { id: "first_review", label: "Первая рецензия", icon: "📝", stat: "reviewCount", goal: 1 },
  { id: "prolific_reviewer", label: "Активный критик", icon: "🖋️", stat: "reviewCount", goal: 10 },
  { id: "review_veteran", label: "Книжный эксперт", icon: "🎓", stat: "reviewCount", goal: 25 },
  { id: "first_book_read", label: "Первая прочитанная", icon: "📖", stat: "booksReadCount", goal: 1 },
  { id: "avid_reader", label: "Заядлый читатель", icon: "📚", stat: "booksReadCount", goal: 10 },
  { id: "bookworm", label: "Книжный червь", icon: "🐛", stat: "booksReadCount", goal: 25 },
  { id: "quote_collector", label: "Коллекционер цитат", icon: "💬", stat: "quotesCount", goal: 5 },
  { id: "popular", label: "Популярный автор", icon: "⭐", stat: "followerCount", goal: 5 },
  { id: "helpful", label: "Полезные советы", icon: "👍", stat: "helpfulReceivedCount", goal: 10 },
];

function computeAchievements(stats) {
  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    label: a.label,
    icon: a.icon,
    goal: a.goal,
    progress: Math.min(stats[a.stat] || 0, a.goal),
    achieved: (stats[a.stat] || 0) >= a.goal,
  }));
}

module.exports = { computeAchievements };

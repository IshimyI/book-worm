// Russian words decline/conjugate with suffixes ("хуйня", "охуенно"), so a
// word-boundary filter tuned for English misses most of them. Match these
// roots as plain substrings instead — this site's reviews are Russian.
const BAD_ROOTS = [
  "хуй",
  "хуе",
  "хуё",
  "пизд",
  "еба",
  "ёба",
  "ебл",
  "бляд",
  "сука",
  "сучк",
  "мудак",
  "мудил",
  "долбоеб",
  "долбоёб",
  "гандон",
  "уебан",
  "пидор",
  "залуп",
  "fuck",
  "shit",
  "bitch",
];

function containsProfanity(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BAD_ROOTS.some((root) => lower.includes(root));
}

module.exports = { containsProfanity };

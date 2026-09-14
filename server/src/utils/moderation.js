

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

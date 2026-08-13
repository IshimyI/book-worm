// Matches @word tokens (letters/digits/underscore, unicode-aware so
// Cyrillic names work too). There's no separate @handle system — this
// matches against User.name directly, so it only catches single-word
// display names exactly as typed, case-insensitively.
function extractMentionTokens(text) {
  const matches = text.match(/@([\p{L}\p{N}_]+)/gu) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

module.exports = { extractMentionTokens };

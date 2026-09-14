

function extractMentionTokens(text) {
  const matches = text.match(/@([\p{L}\p{N}_]+)/gu) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

module.exports = { extractMentionTokens };

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const jwtConfig = require("../configs/jwtConfig");
require("dotenv").config();

// Each refresh token carries a random jti. The caller persists it as the
// user's currentRefreshTokenId so /tokens/refresh can tell a legitimate
// rotation apart from someone replaying an already-rotated-out token.
//
// Pass reuseRefreshTokenId to reissue a token pair bound to an *existing*
// jti instead of minting a new one — used for the refresh-token grace
// period, where a benign race (two near-simultaneous refresh calls with
// the same pre-rotation cookie) should reissue the already-rotated
// session rather than advancing the rotation chain again.
function generateTokens(payload, { reuseRefreshTokenId } = {}) {
  const refreshTokenId = reuseRefreshTokenId || crypto.randomUUID();
  return {
    accessToken: jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      jwtConfig.access
    ),
    refreshToken: jwt.sign(
      { ...payload, jti: refreshTokenId },
      process.env.REFRESH_TOKEN_SECRET,
      jwtConfig.refresh
    ),
    refreshTokenId,
  };
}

module.exports = generateTokens;

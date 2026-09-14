const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const jwtConfig = require("../configs/jwtConfig");
require("dotenv").config();

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



function sanitizeUser(user) {
  const {
    password,
    resetPasswordToken,
    resetPasswordExpires,
    currentRefreshTokenId,
    previousRefreshTokenId,
    refreshTokenRotatedAt,
    twoFactorSecret,
    twoFactorRecoveryCodes,
    ...safe
  } = user;
  return safe;
}

module.exports = sanitizeUser;

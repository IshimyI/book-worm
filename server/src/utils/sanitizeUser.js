// Strips fields that should never leave the server in a user object:
// the password hash, password-reset token/expiry, and the refresh-token
// id used for rotation/reuse detection.
function sanitizeUser(user) {
  const {
    password,
    resetPasswordToken,
    resetPasswordExpires,
    currentRefreshTokenId,
    ...safe
  } = user;
  return safe;
}

module.exports = sanitizeUser;

const express = require("express");
const crypto = require("crypto");
const verifyRefreshToken = require("../middlewares/verifyRefreshToken");
const generateTokens = require("../utils/generateTokens");
const cookieConfig = require("../configs/cookieConfig");
const { User } = require("../../db/models");
const logSecurityEvent = require("../utils/securityLog");
const sanitizeUser = require("../utils/sanitizeUser");

const tokensRouter = express.Router();

// Two near-simultaneous refresh calls carrying the same pre-rotation cookie
// (React StrictMode's double-effect in dev, a network retry, two tabs open
// at once) are a benign race, not theft. A naive fetch-then-save rotation
// lets both requests read the row before either writes back, so both think
// they're the legitimate first rotation and both write a fresh random jti —
// whichever save loses is silently orphaned (the same class of bug the
// reuse detection was meant to catch). The UPDATE below is conditioned on
// currentRefreshTokenId still matching what was presented, so Postgres's
// row-level locking serializes the two requests: only one can win.
const REFRESH_GRACE_PERIOD_MS = 10_000;

tokensRouter.get("/refresh", verifyRefreshToken, async (req, res) => {
  try {
    const { user, jti } = res.locals;
    const newRefreshTokenId = crypto.randomUUID();

    const [rotated] = await User.update(
      {
        previousRefreshTokenId: jti,
        currentRefreshTokenId: newRefreshTokenId,
        refreshTokenRotatedAt: new Date(),
      },
      { where: { id: user.id, currentRefreshTokenId: jti } }
    );

    if (rotated > 0) {
      const dbUser = await User.findByPk(user.id);
      const plainUser = sanitizeUser(dbUser.get({ plain: true }));
      const { accessToken, refreshToken } = generateTokens(
        { user: plainUser },
        { reuseRefreshTokenId: newRefreshTokenId }
      );
      return res
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json({ accessToken, user: plainUser });
    }

    // The conditional UPDATE didn't match — either this request lost the
    // race above (another request already rotated past this exact jti, in
    // which case a fresh read now shows it as previousRefreshTokenId) or
    // it's a genuinely stale/stolen token from further back.
    const dbUser = await User.findByPk(user.id);
    if (!dbUser) {
      return res.clearCookie("refreshToken").sendStatus(401);
    }

    const withinGracePeriod =
      dbUser.previousRefreshTokenId === jti &&
      dbUser.refreshTokenRotatedAt &&
      Date.now() - new Date(dbUser.refreshTokenRotatedAt).getTime() < REFRESH_GRACE_PERIOD_MS;

    if (withinGracePeriod) {
      const plainUser = sanitizeUser(dbUser.get({ plain: true }));
      const { accessToken, refreshToken } = generateTokens(
        { user: plainUser },
        { reuseRefreshTokenId: dbUser.currentRefreshTokenId }
      );
      return res
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json({ accessToken, user: plainUser });
    }

    dbUser.currentRefreshTokenId = null;
    dbUser.previousRefreshTokenId = null;
    await dbUser.save();
    logSecurityEvent({ type: "refresh_token_reuse", email: user.email, ip: req.ip });
    return res.clearCookie("refreshToken").sendStatus(401);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = tokensRouter;

const express = require("express");
const crypto = require("crypto");
const verifyRefreshToken = require("../middlewares/verifyRefreshToken");
const generateTokens = require("../utils/generateTokens");
const cookieConfig = require("../configs/cookieConfig");
const { User } = require("../../db/models");
const logSecurityEvent = require("../utils/securityLog");
const sanitizeUser = require("../utils/sanitizeUser");

const tokensRouter = express.Router();

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

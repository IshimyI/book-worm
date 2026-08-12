const express = require("express");
const verifyRefreshToken = require("../middlewares/verifyRefreshToken");
const generateTokens = require("../utils/generateTokens");
const cookieConfig = require("../configs/cookieConfig");
const { User } = require("../../db/models");
const logSecurityEvent = require("../utils/securityLog");
const sanitizeUser = require("../utils/sanitizeUser");

const tokensRouter = express.Router();

tokensRouter.get("/refresh", verifyRefreshToken, async (req, res) => {
  try {
    const { user, jti } = res.locals;
    const dbUser = await User.findByPk(user.id);

    if (!dbUser || !dbUser.currentRefreshTokenId || dbUser.currentRefreshTokenId !== jti) {
      // The presented token doesn't match the one currently on file —
      // either it was already rotated out (stale tab) or stolen and
      // reused. Either way, kill the session rather than guess which.
      if (dbUser) {
        dbUser.currentRefreshTokenId = null;
        await dbUser.save();
      }
      logSecurityEvent({ type: "refresh_token_reuse", email: user.email, ip: req.ip });
      return res.clearCookie("refreshToken").sendStatus(401);
    }

    const plainUser = sanitizeUser(dbUser.get({ plain: true }));

    const { accessToken, refreshToken, refreshTokenId } = generateTokens({ user: plainUser });
    dbUser.currentRefreshTokenId = refreshTokenId;
    await dbUser.save();

    res
      .cookie("refreshToken", refreshToken, cookieConfig)
      .json({ accessToken, user: plainUser });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = tokensRouter;

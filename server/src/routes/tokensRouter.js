const express = require("express");
const verifyRefreshToken = require("../middlewares/verifyRefreshToken");
const generateTokens = require("../utils/generateTokens");
const cookieConfig = require("../configs/cookieConfig");

const tokensRouter = express.Router();

tokensRouter.get("/refresh", verifyRefreshToken, async (req, res) => {
  try {
    const { accessToken, refreshToken } = generateTokens({
      user: res.locals.user,
    });

    res
      .cookie("refreshToken", refreshToken, cookieConfig)
      .json({ accessToken, user: res.locals.user });
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = tokensRouter;

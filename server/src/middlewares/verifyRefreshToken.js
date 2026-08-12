const jwt = require("jsonwebtoken");

require("dotenv").config();
function verifyRefreshToken(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    const { user, jti } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    res.locals.user = user;
    res.locals.jti = jti;
    next();
  } catch (error) {
    res.clearCookie("refreshToken").sendStatus(401);
  }
}

module.exports = verifyRefreshToken;

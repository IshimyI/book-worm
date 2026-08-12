const jwtConfig = require("./jwtConfig");

const isProduction = process.env.NODE_ENV === "production";

const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "lax" : undefined,
  maxAge: jwtConfig.refresh.expiresIn,
};

module.exports = cookieConfig;

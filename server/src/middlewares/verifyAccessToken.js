const jwt = require("jsonwebtoken");

// Reads the Bearer access token, verifies it, and exposes the authenticated
// user's id as req.userId. Routes then compare req.userId against whatever
// user id they were asked to act on, instead of trusting the request body.
module.exports = function verifyAccessToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decoded.user?.id;
    if (!req.userId) throw new Error("Malformed token payload");
    next();
  } catch (error) {
    return res.status(401).json({ message: "Недействительный или истёкший токен" });
  }
};

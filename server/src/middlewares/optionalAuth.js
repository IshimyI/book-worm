const jwt = require("jsonwebtoken");

module.exports = function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.userId = decoded.user?.id;
    } catch {

    }
  }

  next();
};

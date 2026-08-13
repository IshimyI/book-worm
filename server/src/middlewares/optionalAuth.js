const jwt = require("jsonwebtoken");

// Same token parsing as verifyAccessToken, but for routes that are public
// (readable by anyone) yet still want to personalize the response — e.g.
// showing "you already found this helpful" — for whoever happens to be
// logged in. A missing or invalid token is not an error here, just means
// req.userId stays unset.
module.exports = function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.userId = decoded.user?.id;
    } catch {
      // Ignore — treat as anonymous.
    }
  }

  next();
};

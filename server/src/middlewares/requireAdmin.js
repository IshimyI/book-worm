const { User } = require("../../db/models");

// Must run after verifyAccessToken (needs req.userId).
module.exports = async function requireAdmin(req, res, next) {
  const user = await User.findByPk(req.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Требуются права администратора" });
  }
  next();
};

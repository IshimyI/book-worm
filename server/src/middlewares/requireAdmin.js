const { User } = require("../../db/models");

module.exports = async function requireAdmin(req, res, next) {
  const user = await User.findByPk(req.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Требуются права администратора" });
  }
  next();
};

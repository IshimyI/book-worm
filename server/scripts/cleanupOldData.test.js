const { sequelize, SecurityEvent, User } = require("../db/models");
const cleanupOldData = require("./cleanupOldData");

beforeEach(async () => {
  await SecurityEvent.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("cleanupOldData", () => {
  it("deletes security events older than the retention window but keeps recent ones", async () => {
    const old = await SecurityEvent.create({ type: "failed_login", ip: "1.2.3.4" });
    await SecurityEvent.update({ createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) }, { where: { id: old.id } });
    const recent = await SecurityEvent.create({ type: "failed_login", ip: "5.6.7.8" });

    await cleanupOldData();

    expect(await SecurityEvent.findByPk(old.id)).toBeNull();
    expect(await SecurityEvent.findByPk(recent.id)).not.toBeNull();
  });

  it("clears an expired password reset token but leaves an unexpired one alone", async () => {
    const expiredUser = await User.create({
      name: "Expired",
      email: "expired@example.com",
      password: "hash",
      resetPasswordToken: "expired-token",
      resetPasswordExpires: new Date(Date.now() - 60 * 60 * 1000),
    });
    const activeUser = await User.create({
      name: "Active",
      email: "active@example.com",
      password: "hash",
      resetPasswordToken: "active-token",
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    await cleanupOldData();

    await expiredUser.reload();
    await activeUser.reload();
    expect(expiredUser.resetPasswordToken).toBeNull();
    expect(activeUser.resetPasswordToken).toBe("active-token");
  });
});

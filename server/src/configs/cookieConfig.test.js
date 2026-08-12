describe("cookieConfig", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  test("cookies are not marked secure in development (would break local http)", () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const cookieConfig = require("./cookieConfig");
    expect(cookieConfig.secure).toBe(false);
    expect(cookieConfig.httpOnly).toBe(true);
  });

  test("cookies are marked secure and sameSite in production", () => {
    process.env.NODE_ENV = "production";
    jest.resetModules();
    const cookieConfig = require("./cookieConfig");
    expect(cookieConfig.secure).toBe(true);
    expect(cookieConfig.sameSite).toBe("lax");
  });
});

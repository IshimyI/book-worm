const { containsProfanity } = require("./moderation");

describe("containsProfanity", () => {
  test("returns false for clean text", () => {
    expect(containsProfanity("Отличная книга, всем советую")).toBe(false);
  });

  test("returns false for empty/undefined input", () => {
    expect(containsProfanity("")).toBe(false);
    expect(containsProfanity(undefined)).toBe(false);
  });

  test("catches profanity regardless of word ending", () => {
    expect(containsProfanity("это просто хуйня какая-то")).toBe(true);
    expect(containsProfanity("ЭТО ОХУЕННО")).toBe(true);
  });

  test("catches profanity in the middle of a longer review", () => {
    expect(containsProfanity("Хорошая завязка, но автор пиздит про финал")).toBe(true);
  });

  test("does not flag unrelated words containing similar letters", () => {
    expect(containsProfanity("Сюжет интересный, персонажи живые")).toBe(false);
  });
});

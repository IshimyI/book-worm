const { findPossibleDuplicate, normalizeIsbn } = require("./bookDedup");

describe("normalizeIsbn", () => {
  it("strips hyphens and spaces", () => {
    expect(normalizeIsbn("978-0-441-01359-3")).toBe("9780441013593");
    expect(normalizeIsbn("0 441 01359 7")).toBe("0441013597");
  });

  it("uppercases a trailing ISBN-10 checksum X", () => {
    expect(normalizeIsbn("043942089x")).toBe("043942089X");
  });
});

describe("findPossibleDuplicate", () => {
  const candidates = [
    { id: 1, title: "Дюна", author: "Фрэнк Герберт", isbn: ["9780441013593", "0441013597"] },
    { id: 2, title: "1984", author: "Джордж Оруэлл", isbn: [] },
  ];

  it("matches by ISBN even when title/author don't line up at all", () => {
    // Simulates a Goodreads row: Latin author name, English title — would
    // never match by string comparison against the Cyrillic catalog entry.
    const match = findPossibleDuplicate("Dune", "Frank Herbert", candidates, "978-0-441-01359-3");
    expect(match?.id).toBe(1);
  });

  it("matches an ISBN-10 row against a book catalogued with the ISBN-13", () => {
    const match = findPossibleDuplicate("Something else entirely", "Someone else", candidates, "0441013597");
    expect(match?.id).toBe(1);
  });

  it("falls back to title+author when there's no ISBN on either side", () => {
    const match = findPossibleDuplicate("1984", "Джордж Оруэлл", candidates, "");
    expect(match?.id).toBe(2);
  });

  it("falls back to title+author when the ISBN doesn't match anything", () => {
    const match = findPossibleDuplicate("Дюна", "Фрэнк Герберт", candidates, "0000000000");
    expect(match?.id).toBe(1);
  });

  it("returns null when neither ISBN nor title+author match", () => {
    const match = findPossibleDuplicate("Совершенно новая книга", "Неизвестный автор", candidates, "1111111111");
    expect(match).toBeNull();
  });
});

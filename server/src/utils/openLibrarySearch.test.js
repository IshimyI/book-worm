const { searchOpenLibraryCover } = require("./openLibrarySearch");

function mockDocs(docs) {
  return { ok: true, json: async () => ({ docs }) };
}

describe("searchOpenLibraryCover", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns cover/genre/year/isbn from the top result", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      mockDocs([{ cover_i: 42, subject: ["Fantasy", "Adventure"], first_publish_year: 1965, isbn: ["1111111111"] }])
    );
    const result = await searchOpenLibraryCover("Дюна", "Фрэнк Герберт");
    expect(result).toEqual({
      img: "https://covers.openlibrary.org/b/id/42-L.jpg",
      genre: "Fantasy",
      year: 1965,
      isbn: ["1111111111"],
    });
  });

  it("falls back to a later result for isbn when the top match has none", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      mockDocs([
        { cover_i: 1, subject: ["Roman"], first_publish_year: 1965, isbn: [] },
        { cover_i: 2, isbn: ["2222222222"] },
      ])
    );
    const result = await searchOpenLibraryCover("Дюна", "Фрэнк Герберт");
    // Cover/genre/year still from the best (first) match...
    expect(result.img).toBe("https://covers.openlibrary.org/b/id/1-L.jpg");
    expect(result.genre).toBe("Roman");
    // ...but the isbn comes from whichever result actually has one.
    expect(result.isbn).toEqual(["2222222222"]);
  });

  it("retries with title-only when the combined title+author query finds nothing", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(mockDocs([]))
      .mockResolvedValueOnce(mockDocs([{ cover_i: 7, isbn: ["3333333333"] }]));

    const result = await searchOpenLibraryCover("1984", "Джордж Оруэлл");

    const decode = (url) => decodeURIComponent(url.replace(/\+/g, " "));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(decode(fetchSpy.mock.calls[0][0])).toContain("q=1984 Джордж Оруэлл");
    expect(decode(fetchSpy.mock.calls[1][0])).toContain("q=1984");
    expect(decode(fetchSpy.mock.calls[1][0])).not.toContain("Оруэлл");
    expect(result.isbn).toEqual(["3333333333"]);
  });

  it("caps the isbn list at 30", async () => {
    const manyIsbns = Array.from({ length: 50 }, (_, i) => String(i));
    jest.spyOn(global, "fetch").mockResolvedValue(mockDocs([{ cover_i: 1, isbn: manyIsbns }]));
    const result = await searchOpenLibraryCover("Дюна", "Фрэнк Герберт");
    expect(result.isbn).toHaveLength(30);
  });

  it("returns null when nothing matches either query", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(mockDocs([]));
    const result = await searchOpenLibraryCover("Совершенно неизвестная книга XYZ123", "Никто");
    expect(result).toBeNull();
  });

  it("returns null when the request fails, without throwing", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const result = await searchOpenLibraryCover("Дюна", "Фрэнк Герберт");
    expect(result).toBeNull();
  });

  it("returns null on a non-ok response", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false });
    const result = await searchOpenLibraryCover("Дюна", "Фрэнк Герберт");
    expect(result).toBeNull();
  });
});

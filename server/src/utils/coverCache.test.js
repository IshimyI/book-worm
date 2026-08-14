const fs = require("fs");
const { getCachedCoverPath, COVER_CACHE_DIR } = require("./coverCache");

function cleanup(filename) {
  const diskPath = `${COVER_CACHE_DIR}/${filename}`;
  if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
}

describe("getCachedCoverPath", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    cleanup("test-cover-9999.jpg");
  });

  it("refuses a URL that isn't from covers.openlibrary.org", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const result = await getCachedCoverPath("https://evil.example.com/cover.jpg");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a non-http(s) URL without throwing", async () => {
    const result = await getCachedCoverPath("file:///etc/passwd");
    expect(result).toBeNull();
  });

  it("refuses a malformed URL string without throwing", async () => {
    const result = await getCachedCoverPath("not a url");
    expect(result).toBeNull();
  });

  it("downloads and caches a cover on first request", async () => {
    const bytes = Buffer.from("fake-jpeg-bytes");
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      headers: { get: () => "image/jpeg" },
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    });

    const result = await getCachedCoverPath("https://covers.openlibrary.org/b/id/test-cover-9999.jpg");
    expect(result).toBe("/uploads/covers/test-cover-9999.jpg");
    expect(fs.readFileSync(`${COVER_CACHE_DIR}/test-cover-9999.jpg`)).toEqual(bytes);
  });

  it("serves from disk on a second request without fetching again", async () => {
    fs.writeFileSync(`${COVER_CACHE_DIR}/test-cover-9999.jpg`, "already-cached");
    const fetchSpy = jest.spyOn(global, "fetch");

    const result = await getCachedCoverPath("https://covers.openlibrary.org/b/id/test-cover-9999.jpg");
    expect(result).toBe("/uploads/covers/test-cover-9999.jpg");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null when Open Library responds with an error status", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false });
    const result = await getCachedCoverPath("https://covers.openlibrary.org/b/id/test-cover-9999.jpg");
    expect(result).toBeNull();
  });

  it("returns null when the response isn't actually an image", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      headers: { get: () => "text/html" },
    });
    const result = await getCachedCoverPath("https://covers.openlibrary.org/b/id/test-cover-9999.jpg");
    expect(result).toBeNull();
  });

  it("returns null when the fetch itself fails", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const result = await getCachedCoverPath("https://covers.openlibrary.org/b/id/test-cover-9999.jpg");
    expect(result).toBeNull();
  });
});

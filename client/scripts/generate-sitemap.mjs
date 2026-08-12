// Run at deploy time against the live API and writes a static
// sitemap.xml into public/ so `vite build` ships it as a plain file —
// no server route or nginx changes needed for a catalog this size.
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const SITE = process.env.SITEMAP_BASE_URL || "https://mrbookworm.ru";
const __dirname = dirname(fileURLToPath(import.meta.url));

async function fetchAllBooks() {
  const books = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${SITE}/api/listAllBooks?page=${page}&pageSize=50`);
    const data = await res.json();
    books.push(...data.books);
    if (page >= data.totalPages) break;
    page += 1;
  }
  return books;
}

function urlEntry(loc, { priority = "0.5", changefreq = "weekly" } = {}) {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const books = await fetchAllBooks();

  const staticEntries = [
    urlEntry(`${SITE}/`, { priority: "1.0", changefreq: "daily" }),
    urlEntry(`${SITE}/news`, { priority: "0.6", changefreq: "daily" }),
    urlEntry(`${SITE}/faq`, { priority: "0.3", changefreq: "monthly" }),
    urlEntry(`${SITE}/privacy`, { priority: "0.2", changefreq: "yearly" }),
    urlEntry(`${SITE}/terms`, { priority: "0.2", changefreq: "yearly" }),
  ];
  const bookEntries = books.map((b) =>
    urlEntry(`${SITE}/books/${b.id}`, { priority: "0.7", changefreq: "weekly" })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...staticEntries,
    ...bookEntries,
  ].join("\n")}\n</urlset>\n`;

  const outPath = join(__dirname, "..", "public", "sitemap.xml");
  writeFileSync(outPath, xml);
  console.log(`sitemap.xml written with ${staticEntries.length + bookEntries.length} URLs -> ${outPath}`);
}

main().catch((error) => {
  console.error("Failed to generate sitemap:", error.message);
  process.exit(1);
});

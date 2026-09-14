

async function runSearch(q) {

  const params = new URLSearchParams({
    q,
    limit: "5",
    fields: "title,author_name,subject,first_publish_year,cover_i,isbn",
  });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.docs?.length ? data.docs : null;
}

async function searchOpenLibraryCover(title, author) {
  try {
    let docs = await runSearch(`${title} ${author}`.trim());

    if (!docs) {
      docs = await runSearch(title);
    }
    const doc = docs?.[0];
    if (!doc) return null;

    const isbnDoc = docs.find((d) => Array.isArray(d.isbn) && d.isbn.length > 0) || doc;

    return {
      img: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
      genre: Array.isArray(doc.subject) && doc.subject.length > 0 ? String(doc.subject[0]).slice(0, 40) : null,
      year: doc.first_publish_year || null,

      isbn: Array.isArray(isbnDoc.isbn) ? isbnDoc.isbn.slice(0, 30) : [],
    };
  } catch {
    return null;
  }
}

module.exports = { searchOpenLibraryCover };

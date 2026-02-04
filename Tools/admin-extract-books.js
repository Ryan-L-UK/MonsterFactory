const fs = require("fs");

// --- Load both source files ---
const books = JSON.parse(
  fs.readFileSync("../Data/SourceFiles/books.json", "utf8"),
);
const adventures = JSON.parse(
  fs.readFileSync("../Data/SourceFiles/adventures.json", "utf8"),
);

// --- Extract normalised entries from each ---
const bookList = books.book.map((b) => ({
  name: b.name,
  id: b.id,
  published: b.published,
  type: "book",
}));

const adventureList = adventures.adventure.map((a) => ({
  name: a.name,
  id: a.id,
  published: a.published,
  type: "adventure",
}));

// --- Combine + alphabetise ---
const combined = [...bookList, ...adventureList].sort((a, b) =>
  a.name.localeCompare(b.name),
);

// --- Write output ---
fs.writeFileSync(
  "../Data/books.ids.generated.json",
  JSON.stringify(combined, null, 2),
);

console.log("Done. Extracted", combined.length, "items (books + adventures).");

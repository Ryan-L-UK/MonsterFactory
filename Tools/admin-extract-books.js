const fs = require("fs");

// Load the full books.json
const data = JSON.parse(fs.readFileSync("../Data/books.source.json", "utf8"));

// Extract only name + id
const smallList = data.book.map((b) => ({
  name: b.name,
  id: b.id,
}));

// Write to a new file
fs.writeFileSync(
  "../Data/books.ids.generated.json",
  JSON.stringify(smallList, null, 2)
);

console.log("Done. Extracted", smallList.length, "books.");

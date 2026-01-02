const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 6969;
// Serve robot.txt
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(
    "User-agent: *\nAllow: /\nSitemap: https://ryanfuturistics.uk/sitemap.xml"
  );
});
// Serve static folders with fantasy names
app.use(express.static(__dirname));
app.use("/UI", express.static(path.join(__dirname, "UI")));
app.use("/Data", express.static(path.join(__dirname, "Data")));
app.use("/Engine", express.static(path.join(__dirname, "Engine")));
app.use("/Assets", express.static(path.join(__dirname, "Assets")));
// ---------------------------------------------------------
// Load and merge all bestiary files ONCE at server startup
// ---------------------------------------------------------
let mergedCreatures = [];
function getCR(monster) {
  // CR can be a string: "1/2"
  if (typeof monster.cr === "string") return monster.cr;
  // CR can be an object: { cr: "1/2", lair: true }
  if (monster.cr && typeof monster.cr.cr === "string") return monster.cr.cr;
  return null;
}
function loadBestiary() {
  const indexPath = path.join(__dirname, "Data/bestiary-index.json");
  const exclusionPath = path.join(__dirname, "Data/AdminExclusionList.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  let exclusionList = [];
  try {
    exclusionList = JSON.parse(fs.readFileSync(exclusionPath, "utf8"));
  } catch {
    console.warn(
      "⚠ No ExclusionList.json found. Continuing without exclusions."
    );
  }
  const allowedCR = new Set(["0", "1/8", "1/4", "1/2", "1", "2", "3", "4"]);
  mergedCreatures = index.files.flatMap((file) => {
    const filePath = path.join(__dirname, "Data/handbooks", file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const monsters = data.monster || [];
    return monsters.filter((m) => {
      const cr = getCR(m);
      return (
        // 1. CR must be allowed
        allowedCR.has(cr) &&
        // 2. Exclude legendary
        (!m.legendary || m.legendary.length === 0) &&
        // 3. Exclude copy templates
        !m._copy &&
        // 4. Exclude anything in ExclusionList.json
        !exclusionList.includes(m.name)
      );
    });
  });
  console.log(
    `Loaded ${mergedCreatures.length} creatures into memory (CR ≤ 5)`
  );
}
loadBestiary();
// ---------------------------------------------------------
// Load and merge book ID files ONCE at server startup
// ---------------------------------------------------------
let mergedBooks = [];
function loadBooks() {
  const autoPath = path.join(__dirname, "Data/book-ids.json");
  const manualPath = path.join(__dirname, "Data/book-ids-manual.json");
  const auto = JSON.parse(fs.readFileSync(autoPath, "utf8"));
  let manual = [];
  try {
    manual = JSON.parse(fs.readFileSync(manualPath, "utf8"));
  } catch {
    console.warn(
      "⚠ No book-ids-manual.json found. Continuing without overrides."
    );
  }
  // Merge with manual taking priority
  const map = new Map();
  auto.forEach((b) => map.set(b.id, b));
  manual.forEach((b) => map.set(b.id, b)); // overrides auto
  mergedBooks = Array.from(map.values());
  console.log(`Loaded ${mergedBooks.length} book entries into memory.`);
}
loadBooks();
// ---------------------------------------------------------
// Validate book coverage (admin check)
// ---------------------------------------------------------
function validateBookCoverage() {
  if (!mergedBooks.length || !mergedCreatures.length) {
    console.warn("⚠ Cannot validate books — data not loaded.");
    return;
  }
  const creatureSources = new Set(
    mergedCreatures.map((c) => c.source).filter(Boolean)
  );
  const bookIds = new Set(mergedBooks.map((b) => b.id));
  // Creature sources that do NOT exist in the book list
  const unknownSources = [...creatureSources].filter(
    (src) => !bookIds.has(src)
  );
  console.log("--------------------------------------------------");
  console.log("Missing Book IDs (creature sources not found in book list)");
  console.log("--------------------------------------------------");
  if (unknownSources.length === 0) {
    console.log("✔ All creature sources exist in the book list.");
  } else {
    unknownSources.forEach((src) => console.log(` - ${src}`));
  }
  console.log("--------------------------------------------------");
}
validateBookCoverage();
// ---------------------------------------------------------
// API endpoints to serve merged creatures & books
// ---------------------------------------------------------
app.get("/api/creatures", (req, res) => {
  res.json(mergedCreatures);
});
app.get("/api/books", (req, res) => {
  res.json(mergedBooks);
});
// Default route → index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Index.html"));
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});
app.listen(port, () => {
  console.log(
    `MonsterFactory started successfully @ http://localhost:${port} do not close this terminal`
  );
});

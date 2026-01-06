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
  if (typeof monster.cr === "string") return monster.cr;
  if (monster.cr && typeof monster.cr.cr === "string") return monster.cr.cr;
  return null;
}

function loadBestiary() {
  const indexPath = path.join(__dirname, "Data/bestiary.index.source.json");
  const exclusionPathStandard = path.join(
    __dirname,
    "Data/bestiary.exclusions.generated.json"
  );
  const exclusionPathStrong = path.join(
    __dirname,
    "Data/bestiary.exclusions.generated.strong.json"
  );
  const manualExclusionPath = path.join(
    __dirname,
    "Data/bestiary.exclusions.manual.json"
  );

  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

  // Load auto-generated exclusions
  // Load auto-generated exclusions
  let exclusionListStandard = [];
  try {
    exclusionListStandard = JSON.parse(
      fs.readFileSync(exclusionPathStandard, "utf8")
    );
  } catch {
    console.warn("⚠ No standard exclusion list found.");
  }

  let exclusionListStrong = [];
  try {
    exclusionListStrong = JSON.parse(
      fs.readFileSync(exclusionPathStrong, "utf8")
    );
  } catch {
    console.warn("⚠ No strong exclusion list found.");
  }

  // Load manually curated exclusions
  let manualExclusionList = [];
  try {
    manualExclusionList = JSON.parse(
      fs.readFileSync(manualExclusionPath, "utf8")
    );
  } catch {
    console.warn("⚠ No manual exclusion list found.");
  }

  // Merge all exclusions
  const combinedExclusions = new Set([
    ...exclusionListStandard,
    ...exclusionListStrong,
    ...manualExclusionList,
  ]);

  const allowedCR = new Set([
    "0",
    "1/8",
    "1/4",
    "1/2",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
  ]);

  mergedCreatures = index.files.flatMap((file) => {
    const filePath = path.join(__dirname, "Data/handbooks", file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const monsters = data.monster || [];

    return monsters.filter((m) => {
      const cr = getCR(m);
      return (
        allowedCR.has(cr) &&
        (!m.legendary || m.legendary.length === 0) &&
        !m._copy &&
        !combinedExclusions.has(m.name)
      );
    });
  });

  console.log(
    `Loaded ${mergedCreatures.length} creatures into memory (CR ≤ 6)`
  );
}

loadBestiary();

// ---------------------------------------------------------
// Load and merge book ID files ONCE at server startup
// ---------------------------------------------------------
let mergedBooks = [];
function loadBooks() {
  const autoPath = path.join(__dirname, "Data/books.ids.generated.json");
  const manualPath = path.join(__dirname, "Data/books.ids.manual.json");
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

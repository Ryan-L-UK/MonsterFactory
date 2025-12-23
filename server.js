const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 6969;

// Serve static folders with fantasy names
app.use("/Armoury", express.static(path.join(__dirname, "Armoury")));
app.use("/Bestiary", express.static(path.join(__dirname, "Bestiary")));
app.use("/Codex", express.static(path.join(__dirname, "Codex")));
app.use("/Spellbook", express.static(path.join(__dirname, "Spellbook")));
app.use("/Vault", express.static(path.join(__dirname, "Vault")));

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
  const indexPath = path.join(__dirname, "Bestiary/bestiary-index.json");
  const exclusionPath = path.join(
    __dirname,
    "Bestiary/AdminExclusionList.json"
  );

  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

  let exclusionList = [];
  try {
    exclusionList = JSON.parse(fs.readFileSync(exclusionPath, "utf8"));
  } catch {
    console.warn(
      "⚠ No ExclusionList.json found. Continuing without exclusions."
    );
  }

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
  ]);

  mergedCreatures = index.files.flatMap((file) => {
    const filePath = path.join(__dirname, "Bestiary/handbooks", file);
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
// API endpoint to serve merged creatures
// ---------------------------------------------------------
app.get("/api/creatures", (req, res) => {
  res.json(mergedCreatures);
});

// Default route → index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Index.html"));
});

app.listen(port, () => {
  console.log(
    `MonsterFactory started successfully @ http://localhost:${port} do not close this terminal`
  );
});

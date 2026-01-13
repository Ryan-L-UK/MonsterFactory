const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 6969;

// ---------------------------------------------------------
// Arcane Logging Helpers (Aligned Output)
// ---------------------------------------------------------
const PREFIX_WIDTH = 55;
function formatPrefix(section) {
  const ts = new Date().toISOString();
  const raw = `[${ts}] [${section}]`;
  return raw.padEnd(PREFIX_WIDTH, " ");
}
function log(section, message) {
  console.log(`${formatPrefix(section)}${message}`);
}
function warn(section, message) {
  console.warn(`${formatPrefix(section)}⚠ ${message}`);
}

// ---------------------------------------------------------
// robots.txt
// ---------------------------------------------------------
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(
    "User-agent: *\nAllow: /\nSitemap: https://ryanfuturistics.uk/public/sitemap.xml"
  );
});

// ---------------------------------------------------------
// Static File Serving (NEW — only serve /public)
// ---------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));
log("SERVER", "The MonsterFactory halls preparing for visitors.");

// ---------------------------------------------------------
// Global Data Stores
// ---------------------------------------------------------
let mergedBooks = [];
let mergedCreatures = [];
let loadedAttributes = [];
let loadedPerks = [];

// ---------------------------------------------------------
// BOOKS — The Archivist's Ledger
// ---------------------------------------------------------
function loadBooks() {
  log("BOOKS", "-------------------------------------------");
  log("BOOKS", "The Archivist begins unfurling tomes of lore…");

  const autoPath = path.join(__dirname, "Data/books.ids.generated.json");
  const manualPath = path.join(__dirname, "Data/books.ids.manual.json");

  const auto = JSON.parse(fs.readFileSync(autoPath, "utf8"));
  log("BOOKS", `${auto.length} auto-scribed tomes found by The Archivist.`);

  let manual = [];
  try {
    manual = JSON.parse(fs.readFileSync(manualPath, "utf8"));
    log("BOOKS", `${manual.length} override tomes inscribed by the Artificer.`);
  } catch {
    warn("BOOKS", "No manual overrides found in the ledger.");
  }

  const map = new Map();
  auto.forEach((b) => map.set(b.id, b));
  manual.forEach((b) => map.set(b.id, b));

  mergedBooks = Array.from(map.values());
  log("BOOKS", `${mergedBooks.length} total volumes bound into the ledger.`);
  log("BOOKS", "-------------------------------------------");
}
loadBooks();

// ---------------------------------------------------------
// FORGE — Attributes & Perks Infusion
// ---------------------------------------------------------
function loadForgeModifiers() {
  log("FORGE", "-------------------------------------------");
  log("FORGE", "The Artificer stokes the infusion forge…");

  const attributesPath = path.join(__dirname, "Data/modifier.attributes.json");
  const perksPath = path.join(__dirname, "Data/modifier.perks.json");

  try {
    loadedAttributes = JSON.parse(fs.readFileSync(attributesPath, "utf8"));
    log(
      "FORGE",
      `${loadedAttributes.length} attributes etched into the arcane matrix.`
    );
  } catch {
    warn("FORGE", "No attribute schematics found for the forge.");
    loadedAttributes = [];
  }

  try {
    loadedPerks = JSON.parse(fs.readFileSync(perksPath, "utf8"));
    log("FORGE", `${loadedPerks.length} perks infused into the system's core.`);
  } catch {
    warn("FORGE", "No perk infusions found for the forge.");
    loadedPerks = [];
  }

  log("FORGE", "-------------------------------------------");
}
loadForgeModifiers();

// ---------------------------------------------------------
// BESTIARY — Grand Survey of Beasts
// ---------------------------------------------------------
function getCR(monster) {
  if (typeof monster.cr === "string") return monster.cr;
  if (monster.cr && typeof monster.cr.cr === "string") return monster.cr.cr;
  return null;
}

function creatureNameToImageFile(name) {
  return name.replace(/'/g, "") + ".webp";
}

function loadBestiary() {
  log("BESTIARY", "-------------------------------------------");
  log("BESTIARY", "The Menagerie gates creak open…");

  const indexPath = path.join(__dirname, "Data/bestiary.index.source.json");
  const manualExclusionPath = path.join(
    __dirname,
    "Data/bestiary.exclusions.manual.json"
  );

  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  log("BESTIARY", `${index.files.length} bestiary tomes discovered.`);

  let manualExclusionList = [];
  try {
    manualExclusionList = JSON.parse(
      fs.readFileSync(manualExclusionPath, "utf8")
    );
    log(
      "BESTIARY",
      `${manualExclusionList.length} creatures marked by the Artificer's decree.`
    );
  } catch {
    warn("BESTIARY", "Manual exclusion list missing.");
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
    "6",
  ]);

  let totalDiscovered = 0;
  const allCreatures = index.files.flatMap((file) => {
    const filePath = path.join(__dirname, "Data/handbooks", file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const monsters = data.monster || [];
    totalDiscovered += monsters.length;
    return monsters;
  });

  log("BESTIARY", `${totalDiscovered} creatures discovered across all tomes.`);

  let manualExcludedCount = 0;
  let overCR6Count = 0;
  let legendaryCount = 0;
  let copyCount = 0;
  let noImageCount = 0;

  mergedCreatures = allCreatures.filter((m) => {
    const name = m.name;

    if (manualExclusionList.includes(name)) {
      manualExcludedCount++;
      return false;
    }

    const cr = getCR(m);
    if (!allowedCR.has(cr)) {
      overCR6Count++;
      return false;
    }

    const isLegendary =
      (m.legendary && m.legendary.length > 0) || m.legendaryGroup;
    if (isLegendary) {
      legendaryCount++;
      return false;
    }

    if (m._copy) {
      copyCount++;
      return false;
    }

    const imageFile = creatureNameToImageFile(name);
    const imagePath = path.join(
      __dirname,
      "public/Assets/Creatures",
      imageFile
    );

    if (!fs.existsSync(imagePath)) {
      noImageCount++;
      return false;
    }

    return true;
  });

  log(
    "BESTIARY",
    `${manualExcludedCount} creatures manually excluded by the Artificer.`
  );
  log("BESTIARY", `${overCR6Count} beasts banished for exceeding CR6 rating.`);
  log(
    "BESTIARY",
    `${legendaryCount} legendary entities sealed away from the menagerie.`
  );
  log(
    "BESTIARY",
    `${copyCount} echo-creatures dismissed as reflections (_copy).`
  );
  log(
    "BESTIARY",
    `${noImageCount} creatures dismissed as invisible (no image file).`
  );
  log(
    "BESTIARY",
    `${mergedCreatures.length} creatures remain in the menagerie, ready for summoning.`
  );
  log("BESTIARY", "-------------------------------------------");
}
loadBestiary();

// ---------------------------------------------------------
// VALIDATION — Ledger Cross-Check
// ---------------------------------------------------------
function validateBookCoverage() {
  log("VALIDATION", "-------------------------------------------");
  log(
    "VALIDATION",
    "The Archivist cross-checks creature sources against tomes…"
  );

  if (!mergedBooks.length || !mergedCreatures.length) {
    warn(
      "VALIDATION",
      "Cannot validate — either the ledger or the menagerie is empty."
    );
    log("VALIDATION", "-------------------------------------------");
    return;
  }

  const creatureSources = new Set(
    mergedCreatures.map((c) => c.source).filter(Boolean)
  );
  const bookIds = new Set(mergedBooks.map((b) => b.id));

  const unknownSources = [...creatureSources].filter(
    (src) => !bookIds.has(src)
  );

  if (unknownSources.length === 0) {
    log(
      "VALIDATION",
      "All creature sources accounted for in the Archivist's ledger."
    );
  } else {
    warn(
      "VALIDATION",
      `${unknownSources.length} sources lack matching tomes in the ledger:`
    );
    unknownSources.forEach((src) =>
      warn("VALIDATION", `Uncatalogued source detected: ${src}`)
    );
  }

  log("VALIDATION", "-------------------------------------------");
}
validateBookCoverage();

// ---------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------
app.get("/api/creatures", (req, res) => res.json(mergedCreatures));
app.get("/api/books", (req, res) => res.json(mergedBooks));
app.get("/api/attributes", (req, res) => res.json(loadedAttributes));
app.get("/api/perks", (req, res) => res.json(loadedPerks));

// ---------------------------------------------------------
// GALLERY — Server-rendered curated creature list
// ---------------------------------------------------------
app.get("/gallery", (req, res) => {
  const curatedPath = path.join(__dirname, "public/Assets/Curated");
  const templatePath = path.join(__dirname, "public/gallery.html");

  try {
    // Load template
    let template = fs.readFileSync(templatePath, "utf8");

    // Read all curated creature folders
    const folders = fs.readdirSync(curatedPath).filter((f) => {
      const full = path.join(curatedPath, f);
      return fs.statSync(full).isDirectory();
    });

    // Build gallery tiles
    const tiles = folders
      .map((id) => {
        const jsonPath = path.join(curatedPath, id, "data.json");
        const imagePath = `/Assets/Curated/${id}/image.png`;

        if (!fs.existsSync(jsonPath)) return "";

        const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

        return `
          <a class="curated-card" href="/content?id=${id}">
            <img src="${imagePath}" alt="${data.name}" />
            <div class="curated-content">
              <h3>${data.name}</h3>
              <h4>${data.subtitle || ""}</h4>
              <p>${data.short || ""}</p>
            </div>
          </a>
        `;
      })
      .join("\n");

    // Inject tiles into template
    const finalHtml = template.replace("{{GALLERY_TILES}}", tiles);

    res.send(finalHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating gallery.");
  }
});

// ---------------------------------------------------------
// CONTENT PAGE — Server-rendered creature viewer
// ---------------------------------------------------------
app.get("/content", (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(404).send("Creature not specified.");

  const creaturePath = path.join(__dirname, "public/Assets/Curated", id);
  const templatePath = path.join(__dirname, "public/content.html");

  try {
    // Load template
    let template = fs.readFileSync(templatePath, "utf8");

    // Load creature JSON
    const jsonPath = path.join(creaturePath, "data.json");
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).send("Creature not found.");
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    // Extract fields
    const name = data.name || id;
    const subtitle = data.subtitle || "";
    const description =
      data.short || `${name} — a curated creature from MonsterFactory.`;
    const imageUrl = `https://monsterfactory.app/Assets/Curated/${id}/image.png`;

    // Inject into template
    template = template
      .replace(/{{CREATURE_ID}}/g, id)
      .replace(/{{CREATURE_NAME}}/g, name)
      .replace(/{{CREATURE_SUBTITLE}}/g, subtitle)
      .replace(/{{CREATURE_DESCRIPTION}}/g, description)
      .replace(/{{CREATURE_IMAGE_URL}}/g, imageUrl);

    res.send(template);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error rendering creature page.");
  }
});

// ---------------------------------------------------------
// Routes
// ---------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 204 Forbidden (handler)
app.use((req, res, next) => {
  if (req.url.startsWith("/.well-known/appspecific")) {
    return res.status(204).end(); // No Content, silent
  }
  next();
});

// 403 Forbidden (handler)
const blockedWP = ["/wp-admin", "/wordpress", "/wp-login.php", "/xmlrpc.php"];

app.use((req, res, next) => {
  if (blockedWP.some((p) => req.url.startsWith(p))) {
    return res.status(403).end(); // Forbidden, no logging
  }
  next();
});

// 404 Page Not Found (handler)
app.use((req, res) => {
  warn("ROUTE", `A traveller wanders into the void: ${req.method} ${req.url}`);
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

// ---------------------------------------------------------
// SERVER — Engine Awakening
// ---------------------------------------------------------
app.listen(port, () => {
  log("SERVER", "-------------------------------------------");
  log("SERVER", "The MonsterFactory engine awakens.");
  log("SERVER", `Realm accessible at http://localhost:${port}.`);
  log(
    "SERVER",
    `Environment attuned to: ${process.env.NODE_ENV || "development"}`
  );
  log("SERVER", "-------------------------------------------");
});

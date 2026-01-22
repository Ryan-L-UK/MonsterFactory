const express = require("express");
const path = require("path");
const fs = require("fs");
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logPath = path.join(logsDir, "monsterfactory.log");
const logFile = fs.createWriteStream(logPath, { flags: "a" });
const app = express();
const port = 6969;
// ---------------------------------------------------------
// Arcane Logging Helpers (Aligned Output)
// ---------------------------------------------------------
const PREFIX_WIDTH = 44;
const CR_ORDER = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6"];
function formatPrefix(section) {
  const ts = new Date().toISOString();
  const raw = `[${ts}] [${section}]`;
  return raw.padEnd(PREFIX_WIDTH, " ");
}
function log(section, message) {
  const line = `${formatPrefix(section)}${message}\n`;
  console.log(line);
  logFile.write(line);
}
function warn(section, message) {
  const line = `${formatPrefix(section)}⚠ ${message}\n`;
  console.warn(line);
  logFile.write(line);
}
// ---------------------------------------------------------
// Static File Serving (NEW — only serve /public)
// ---------------------------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
log("SERVER", "-------------------------------------------");
log("SERVER", "The primary engine stirs.");
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
  log("BOOKS", "Blueprint vault unlocked...");
  const autoPath = path.join(__dirname, "Data/books.ids.generated.json");
  const manualPath = path.join(__dirname, "Data/books.ids.manual.json");
  const auto = JSON.parse(fs.readFileSync(autoPath, "utf8"));
  log("BOOKS", `${auto.length} Auto-Schematics retrieved.`);
  let manual = [];
  try {
    manual = JSON.parse(fs.readFileSync(manualPath, "utf8"));
    log("BOOKS", `${manual.length} Manual-Schematics detected.`);
  } catch {
    warn("BOOKS", "No Manual-Schematics detected.");
  }
  const map = new Map();
  auto.forEach((b) => map.set(b.id, b));
  manual.forEach((b) => map.set(b.id, b));
  mergedBooks = Array.from(map.values());
  log("BOOKS", `${mergedBooks.length} Designs fed into the core engine.`);
}
loadBooks();
// ---------------------------------------------------------
// FORGE — Attributes & Perks Infusion
// ---------------------------------------------------------
function loadForgeModifiers() {
  log("FORGE", "-------------------------------------------");
  log("FORGE", "Infusion forge coming online.");
  const attributesPath = path.join(__dirname, "Data/modifier.attributes.json");
  const perksPath = path.join(__dirname, "Data/modifier.perks.json");
  try {
    loadedAttributes = JSON.parse(fs.readFileSync(attributesPath, "utf8"));
    log(
      "FORGE",
      `${loadedAttributes.length} attribute modules fused into the core matrix.`,
    );
  } catch {
    warn("FORGE", "Attribute feed empty — skipping.");
    loadedAttributes = [];
  }
  try {
    loadedPerks = JSON.parse(fs.readFileSync(perksPath, "utf8"));
    log(
      "FORGE",
      `${loadedPerks.length} perk assemblies integrated into the engine core.`,
    );
  } catch {
    warn("FORGE", "Perk feed empty — skipping.");
    loadedPerks = [];
  }
  log("FORGE", "Forge cycle complete.");
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
  log("BESTIARY", "Menagerie intake systems active...");
  const indexPath = path.join(__dirname, "Data/bestiary.index.source.json");
  const manualExclusionPath = path.join(
    __dirname,
    "Data/bestiary.exclusions.manual.json",
  );
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  log("BESTIARY", `${index.files.length} specimen manifests loaded.`);
  let manualExclusionList = [];
  try {
    manualExclusionList = JSON.parse(
      fs.readFileSync(manualExclusionPath, "utf8"),
    );
    log(
      "BESTIARY",
      `${manualExclusionList.length} entries blacklisted by operator.`,
    );
  } catch {
    warn("BESTIARY", "Manual exclusion list missing.");
  }
  const allowedCR = new Set(CR_ORDER);
  let totalDiscovered = 0;
  const allCreatures = index.files.flatMap((file) => {
    const filePath = path.join(__dirname, "Data/handbooks", file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const monsters = data.monster || [];
    totalDiscovered += monsters.length;
    return monsters;
  });
  log(
    "BESTIARY",
    `${totalDiscovered} specimens detected across all manifests.`,
  );
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
      imageFile,
    );
    if (!fs.existsSync(imagePath)) {
      noImageCount++;
      return false;
    }
    return true;
  });
  log(
    "BESTIARY",
    `${manualExcludedCount} specimens rejected by operator review.`,
  );
  log(
    "BESTIARY",
    `${overCR6Count} specimens discarded for excessive threat rating.`,
  );
  log("BESTIARY", `${legendaryCount} high-tier entities quarantined.`);
  log("BESTIARY", `${copyCount} duplicate entries purged.`);
  log(
    "BESTIARY",
    `${noImageCount} specimens discarded due to missing visual records.`,
  );
  log(
    "BESTIARY",
    `${mergedCreatures.length} viable specimens remain in the chamber.`,
  );
}
loadBestiary();
// ---------------------------------------------------------
// FILTER OPTIONS — Extract dropdown values
// ---------------------------------------------------------
function unique(arr) {
  return [...new Set(arr)].sort();
}
const availableCRs = CR_ORDER.filter((cr) =>
  mergedCreatures.some((c) => getCR(c) === cr),
);
const availableTypes = unique(
  mergedCreatures
    .map((c) => c.type?.type ?? c.type) // normalise object/string
    .filter(Boolean) // remove null/undefined
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1)), // capitalise inline
);
const availableAttributes = unique(
  loadedAttributes.map((a) => a.name).filter(Boolean),
);
const availablePerks = unique(loadedPerks.map((p) => p.name).filter(Boolean));
log("FILTERS", "-------------------------------------------");
log("FILTERS", `CR values available: ${availableCRs.length}`);
log("FILTERS", `Types available: ${availableTypes.length}`);
log("FILTERS", `Attributes available: ${availableAttributes.length}`);
log("FILTERS", `Perks available: ${availablePerks.length}`);
// ---------------------------------------------------------
// VALIDATION — Ledger Cross-Check
// ---------------------------------------------------------
function validateBookCoverage() {
  log("VALIDATION", "-------------------------------------------");
  log("VALIDATION", "Inspection cycle initiated — verifying source manifests.");
  if (!mergedBooks.length || !mergedCreatures.length) {
    warn(
      "VALIDATION",
      "Validation aborted — manifests or specimen lists incomplete.",
    );
    log("VALIDATION", "-------------------------------------------");
    return;
  }
  const creatureSources = new Set(
    mergedCreatures.map((c) => c.source).filter(Boolean),
  );
  const bookIds = new Set(mergedBooks.map((b) => b.id));
  const unknownSources = [...creatureSources].filter(
    (src) => !bookIds.has(src),
  );
  if (unknownSources.length === 0) {
    log(
      "VALIDATION",
      "All source manifests accounted for. No discrepancies detected.",
    );
  } else {
    warn(
      "VALIDATION",
      `${unknownSources.length} unregistered sources detected — no matching manifests.`,
    );
    unknownSources.forEach((src) =>
      warn("VALIDATION", `Source mismatch: ${src}`),
    );
  }
  log("VALIDATION", "Inspection cycle complete.");
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
        // -------------------------------
        // TAG RENDERING
        // -------------------------------
        const tagHtml = data.tags
          ? Object.entries(data.tags)
              .map(([category, value]) => {
                const normalised = value
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "");
                return `<span class="mf-tag tag-${category} tag-${normalised}">#${value}</span>`;
              })
              .join(" ")
          : "";
        // -------------------------------
        // TILE HTML
        // -------------------------------
        return `
<a class="curated-card" href="/content?id=${id}">
  <img src="${imagePath}" alt="${data.name}" />
  <div class="curated-content">
    <h3>${data.name}</h3>
    <h4>${data.subtitle || ""}</h4>
    <p>${data.description || ""}</p>
    
    <div class="mf-tag-container"><div class="divider"></div>${tagHtml}</div>
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
      data.description || `${name} — a curated creature from MonsterFactory.`;
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
  res.render("index", {
    crList: availableCRs,
    typeList: availableTypes,
    attributeList: availableAttributes,
    perkList: availablePerks,
  });
});
app.get("/export", (req, res) => {
  res.render("export");
});
// ---------------------------------------------------------
// Silent 204 for Apple / Google verification
// ---------------------------------------------------------
app.use((req, res, next) => {
  const applePaths = [
    "/apple-app-site-association",
    "/.well-known/apple-app-site-association",
    "/.well-known/appspecific",
  ];
  if (applePaths.some((p) => req.url.startsWith(p))) {
    return res.status(204).end();
  }
  next();
});
// ---------------------------------------------------------
// Silent 403 deny‑list for bot/probe traffic
// ---------------------------------------------------------
const denyList = [
  "/wp",
  "/wordpress",
  "/wp-",
  "/wpadmin",
  "/wp-admin",
  "/wp-login",
  "/blog",
  "/cms",
  "/site",
  "/media",
  "/news",
  "/shop",
  "/test",
  "/20",
  "/.env",
  "/.git",
  "/.svn",
  "/backup",
  "/backup.zip",
  ".php",
  "/admin",
  "/api",
  "/login",
];
app.use((req, res, next) => {
  const url = req.url.toLowerCase();
  if (denyList.some((p) => url.includes(p))) {
    return res.status(403).end(); // silent block
  }
  next();
});
// ---------------------------------------------------------
// Legit 405 Method Block (logged)
// ---------------------------------------------------------
app.post("/", (req, res) => {
  return res.status(405).end(); // Method Not Allowed
});
// ---------------------------------------------------------
// Legit 404 handler (logged)
// ---------------------------------------------------------
app.use((req, res) => {
  warn("ROUTE", `Stray worker off-route: ${req.method} ${req.url}`);
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});
// ---------------------------------------------------------
// SERVER — Engine Awakening
// ---------------------------------------------------------
app.listen(port, () => {
  log("SERVER", "-------------------------------------------");
  log("SERVER", "The MonsterFactory engine awakens.");
  log("SERVER", `Factory accessible at http://localhost:${port}.`);
  log(
    "SERVER",
    `Environment deployed: ${process.env.NODE_ENV || "production"}`,
  );
  log("SERVER", "-------------------------------------------");
});

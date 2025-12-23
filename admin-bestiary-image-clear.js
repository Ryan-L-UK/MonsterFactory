const fs = require("fs");
const path = require("path");

// Paths
const INDEX_PATH = path.join(__dirname, "Bestiary/bestiary-index.json");
const HANDBOOKS_DIR = path.join(__dirname, "Bestiary/handbooks");
const IMAGES_DIR = path.join(__dirname, "Vault/Creatures");
const EXCLUSION_PATH = path.join(__dirname, "Bestiary/ExclusionList.json");

// Allowed CR values
const allowedCR = new Set(["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5"]);

// Extract CR safely from 5etools formats
function getCR(monster) {
  if (typeof monster.cr === "string") return monster.cr;
  if (monster.cr && typeof monster.cr.cr === "string") return monster.cr.cr;
  return null;
}

// Normalize creature names and filenames
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Load creatures from all bestiary files
function loadCreatures() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));

  return index.files.flatMap((file) => {
    const filePath = path.join(HANDBOOKS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const monsters = data.monster || [];

    return monsters.filter((m) => {
      const cr = getCR(m);

      return (
        allowedCR.has(cr) && // CR filter
        (!m.legendary || m.legendary.length === 0) && // no legendary
        !m._copy // no copy templates
      );
    });
  });
}

// Main cleaning function
function cleanImages() {
  console.log("Deleting images in progress...");

  const creatures = loadCreatures();

  // Expected normalized names (no extension)
  const expected = new Set(creatures.map((c) => normalizeName(c.name)));

  // Actual image files normalized
  const actualFiles = fs.readdirSync(IMAGES_DIR);
  const actualNormalized = actualFiles.map((f) => ({
    original: f,
    normalized: normalizeName(f.replace(/\.webp$/i, "")),
  }));

  const missing = [];

  // Delete unused images
  for (const file of actualNormalized) {
    if (!expected.has(file.normalized)) {
      fs.unlinkSync(path.join(IMAGES_DIR, file.original));
    }
  }

  // Check for missing images
  for (const creature of creatures) {
    const norm = normalizeName(creature.name);
    const hasImage = actualNormalized.some((f) => f.normalized === norm);

    if (!hasImage) {
      missing.push(creature.name);
    }
  }

  // Write missing names to ExclusionList.json
  fs.writeFileSync(EXCLUSION_PATH, JSON.stringify(missing, null, 2), "utf8");

  console.log(`Total missing: ${missing.length}`);
  console.log(`Missing creature names written to ${EXCLUSION_PATH}`);
}

cleanImages();

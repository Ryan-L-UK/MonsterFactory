const fs = require("fs");
const path = require("path");

// Paths
const INDEX_PATH = path.join(__dirname, "../Data/bestiary.index.source.json");
const HANDBOOKS_DIR = path.join(__dirname, "../Data/handbooks");
const IMAGES_DIR = path.join(__dirname, "../Assets/Creatures");

const GENERATED_MISSING = path.join(
  __dirname,
  "../Data/bestiary.exclusions.generated.json"
);

const GENERATED_STRONG = path.join(
  __dirname,
  "../Data/bestiary.exclusions.generated.strong.json"
);

const MANUAL_EXCLUSION = path.join(
  __dirname,
  "../Data/bestiary.exclusions.manual.json"
);

// Allowed CR values for "normal" creatures
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

    return monsters.map((m) => ({
      ...m,
      cr: getCR(m),
    }));
  });
}

function classifyCreatures() {
  console.log("Classifying creatures...");

  const creatures = loadCreatures();

  // Load manual exclusions
  let manualExclusions = [];
  try {
    manualExclusions = JSON.parse(fs.readFileSync(MANUAL_EXCLUSION, "utf8"));
  } catch {
    console.warn("⚠ No manual exclusion list found.");
  }

  // Actual image files normalized
  const actualFiles = fs.readdirSync(IMAGES_DIR);
  const actualNormalized = new Set(
    actualFiles.map((f) => normalizeName(f.replace(/\.webp$/i, "")))
  );

  const strongExclusions = [];
  const missingImages = [];

  for (const creature of creatures) {
    const name = creature.name;
    const norm = normalizeName(name);

    // Skip manual exclusions entirely
    if (manualExclusions.includes(name)) continue;

    // Bucket A — Strong exclusions (CR > 6)
    if (!allowedCR.has(creature.cr)) {
      strongExclusions.push(name);
      continue;
    }

    // Bucket B — Missing images (CR ≤ 6 but no image)
    const hasImage = actualNormalized.has(norm);
    if (!hasImage) {
      missingImages.push(name);
    }
  }

  // Sort and dedupe
  const sortedStrong = [...new Set(strongExclusions)].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );

  const sortedMissing = [...new Set(missingImages)].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );

  // Write outputs
  fs.writeFileSync(GENERATED_STRONG, JSON.stringify(sortedStrong, null, 2));
  fs.writeFileSync(GENERATED_MISSING, JSON.stringify(sortedMissing, null, 2));

  console.log(`Strong exclusions (CR > 6): ${sortedStrong.length}`);
  console.log(`Missing images (CR ≤ 6): ${sortedMissing.length}`);
  console.log("Done.");
}

classifyCreatures();

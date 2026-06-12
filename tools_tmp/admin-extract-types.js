const fs = require("fs");
const path = require("path");

// Paths
const INDEX_PATH = path.join(__dirname, "../Data/bestiary.index.source.json");
const HANDBOOKS_DIR = path.join(__dirname, "../Data/handbooks");
const EXCLUSION_PATH = path.join(
  __dirname,
  "../Data/bestiary.exclusions.generated.json"
);
const MANUAL_EXCLUSION = path.join(
  __dirname,
  "../Data/bestiary.exclusions.manual.json"
);

// Allowed CR values
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

// Extract type safely (string or object)
function getType(monster) {
  if (typeof monster.type === "string") return monster.type;
  if (monster.type && typeof monster.type.type === "string")
    return monster.type.type;
  return null;
}

function loadCreatures() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));

  // Load generated exclusions
  let exclusionList = [];
  try {
    exclusionList = JSON.parse(fs.readFileSync(EXCLUSION_PATH, "utf8"));
  } catch {
    console.warn("⚠ No generated exclusion list found.");
  }

  // Load manual exclusions
  let manualExclusionList = [];
  try {
    manualExclusionList = JSON.parse(fs.readFileSync(MANUAL_EXCLUSION, "utf8"));
  } catch {
    console.warn("⚠ No manual exclusion list found.");
  }

  // Merge both into a single Set
  const combinedExclusions = new Set([
    ...exclusionList,
    ...manualExclusionList,
  ]);

  return index.files.flatMap((file) => {
    const filePath = path.join(HANDBOOKS_DIR, file);
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
}

function extractTypes() {
  const creatures = loadCreatures();
  const types = new Set();

  for (const creature of creatures) {
    const t = getType(creature);
    if (t) types.add(t);
  }

  const typeList = Array.from(types).sort();

  const outputPath = path.join(
    __dirname,
    "../Data/bestiary.creature.type.generated.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(typeList, null, 2), "utf8");

  console.log(`Extracted ${typeList.length} unique creature types.`);
  console.log(`Written to ${outputPath}`);
}

extractTypes();

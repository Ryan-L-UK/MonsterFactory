//------------------------
//Main Page Load
//------------------------
window.addEventListener("DOMContentLoaded", loadSources);
async function loadSources() {
  // 1. Load merged creatures from the server
  const creatures = await fetch("/api/creatures").then((res) => res.json());
  // 2. Load your other sources in parallel
  const [attributes, perks] = await Promise.all([
    fetch("/Bestiary/attributes.json").then((res) => res.json()),
    fetch("/Bestiary/perks.json").then((res) => res.json()),
  ]);
  // 3. Store everything
  Sources.attributes = attributes;
  Sources.creatures = creatures;
  Sources.perks = perks;
  console.log("All sources loaded:", Sources);
  // 4. Generate your first monster
  generateMonster();
}
//------------------------
//Constants, Vairables & Lets
const safe = (value) => (value != null ? datacleanse(value) : "-");
const setSrc = (id, path) => $(id).setAttribute("src", path);
const setText = (id, text) => ($(id).innerHTML = text);
let Sources = {
  attributes: [],
  creatures: [],
  perks: [],
};
//------------------------
//Element ID Helper
const $ = (id) => document.getElementById(id);
const el = (tag, className, html) => {
  const node = document.createElement(tag);
  if (className) node.classList.add(className);
  if (html) node.innerHTML = html;
  return node;
};
//------------------------
//Randomizers
function getRandomPerk(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomCreature(creatures) {
  return creatures[Math.floor(Math.random() * creatures.length)];
}
//------------------------
//Orchastrator
function generateMonster() {
  const attribute = getRandomPerk(Sources.attributes);
  const creature = Sources.creatures.find((c) => c.name === "Vampiric Mist");
  //const creature = getRandomCreature(Sources.creatures);
  const perk = getRandomPerk(Sources.perks);
  console.log("Picked:", {
    attribute: attribute,
    creature: creature,
    perk: perk,
  });
  renderImageNameBlock(creature, attribute, perk);
  renderAlignment(creature);
  $("size-out").innerHTML = checksize(creature.size);
  const finalStats = calculateFinalStats(creature, attribute, perk);
  renderStatBlock(finalStats, creature, attribute, perk);
  renderHP(creature, attribute, perk);
  renderAC(creature, attribute, perk);
  renderSpeed(creature, attribute, perk);
  $("saves-out").innerHTML = creature.save
    ? Object.entries(creature.save)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    : "-";
  renderList({
    base: normalizeList(creature.vulnerable),
    attr: normalizeList(attribute.vulnerable),
    perk: normalizeList(perk.vulnerable),
    outId: "vulnerable-out",
    rowId: "vulnerable-row",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  renderList({
    base: normalizeList(creature.resist),
    attr: normalizeList(attribute.resist),
    perk: normalizeList(perk.resist),
    outId: "resist-out",
    rowId: "resist-row",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  renderList({
    base: normalizeList(creature.immune),
    attr: normalizeList(attribute.immune),
    perk: normalizeList(perk.immune),
    outId: "immune-out",
    rowId: "immune-row",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  renderList({
    base: normalizeList(creature.conditionImmune),
    attr: normalizeList(attribute.conditionImmune),
    perk: normalizeList(perk.conditionImmune),
    outId: "conditionImmune-out",
    rowId: "conditionImmune-row",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  renderStats(creature);
  renderTraits(creature);
  renderActions(creature);
  //renderSpellcasting(creature);
  if (!attribute || !creature || !perk) {
    alert("Sources not loaded yet!");
    return;
  }
}
//------------------------
//Render Images, Perks, Name & Description
function renderImageNameBlock(creature, attribute, perk) {
  setSrc("CreatureImage", `Vault/Creatures/${creature.name}.webp`);
  setSrc("attribute-icon-out", `/Vault/Icons/Attribute/${attribute.name}.png`);
  setText("attribute-out", attribute.name);
  //------------------------
  const typeName = creature.type.type ?? creature.type;
  setText("type-out", typeName);
  setSrc("type-icon-out", `/Vault/Icons/Type/${typeName}.png`);
  //------------------------
  const tags = creature.type.tags ? ` (${creature.type.tags})` : "";
  setText("tags-out", tags);
  //------------------------
  setSrc("perk-icon-out", `/Vault/Icons/Perk/${perk.name}.png`);
  setText("perk-out", perk.name);
  //------------------------
  setText(
    "name-out",
    `${attribute.prefix} ${creature.name} ${perk.descriptor}`
  );
  //------------------------
  setText(
    "desc-out",
    `This ${creature.name} was ${attribute.origin}. It is ${perk.effect}.`
  );
}
//------------------------
//Check Alignment
function checkalignment(alignment) {
  var checkalignment = "";
  var lookup = {
    C: "Chaotic",
    T: "True",
    L: "Lawful",
    N: "Neutral",
    G: "Good",
    E: "Evil",
    A: "Any Alignment",
    U: "Unaligned",
  };
  checkalignment = lookup[alignment];
  return checkalignment;
}
//------------------------
//Alignment formatter
function formatAlignment(a = []) {
  if (!a.length) return "Unaligned";
  if (a.includes("NY")) return "Any Non-Good Alignment";
  if (a.includes("NX")) return "Any Non-Lawful Alignment";
  //------------------------
  const type = a[0] ? checkalignment(a[0]) : "";
  const cls = a[1] ? checkalignment(a[1]) : "";
  return `${type} ${cls}`.trim();
}
//------------------------
//Render Alignment
function renderAlignment(creature) {
  const alignment = formatAlignment(creature.alignment || []);
  $("alignment-out").innerHTML = alignment;
  $("alignment-out").classList.add(alignment.replace(/\s/g, ""));
}
//------------------------
//Function Check Size
function checksize(size) {
  var checksize = "";
  var lookup = {
    T: "Tiny",
    S: "Small",
    M: "Medium",
    L: "Large",
    H: "Huge",
    G: "Gargantuan",
  };
  checksize = lookup[size];
  return checksize;
}
//------------------------
//Calculate stats with mods
function calculateFinalStats(creature, attribute, perk) {
  const stats = ["str", "dex", "con", "int", "wis", "cha"];
  const result = {};
  stats.forEach((stat) => {
    const base = creature[stat];
    const attr = attribute.statMods?.[stat] ?? 0;
    const perkMod = perk.statMods?.[stat] ?? 0;
    const finalValue = base + attr + perkMod;
    result[stat] = {
      base,
      final: finalValue,
      delta: finalValue - base,
    };
  });
  return result;
}
//------------------------
//Stat Roll Checker
function checkstatrole(modifier) {
  var output = Math.floor((modifier - 10) / 2);
  var symbol = "";
  if (output >= 0) {
    symbol = "+";
  }
  return modifier + " (" + symbol + output + ")";
}
//------------------------
//Add classes to stats
function renderStatBlock(finalStats, creature, attribute, perk) {
  Object.entries(finalStats).forEach(([stat, data]) => {
    const valueEl = document.getElementById(`${stat.toUpperCase()}-out`);
    const labelEl = document.getElementById(`${stat.toUpperCase()}-label`);
    const containerEl = document.getElementById(
      `${stat.toUpperCase()}-Container`
    );
    //------------------------
    if (data.delta > 0) {
      valueEl.classList.add("AbtlyPointIncrease");
    } else if (data.delta < 0) {
      valueEl.classList.add("AbtlyPointDecrease");
    }
    valueEl.innerHTML = checkstatrole(data.final);
    //------------------------
    if (labelEl) {
      if (data.delta > 0) {
        labelEl.classList.add("AbtlyIncrease");
      } else if (data.delta < 0) {
        labelEl.classList.add("AbtlyDecrease");
      }
    }
    //------------------------
    if (data.delta !== 0) {
      const attrMod = attribute.statMods?.[stat] ?? 0;
      const perkMod = perk.statMods?.[stat] ?? 0;
      containerEl.dataset.tooltip =
        `Base (${creature.name}): ${data.base}\n` +
        `${attribute.name}: ${attrMod >= 0 ? "+" + attrMod : attrMod}\n` +
        `${perk.name}: ${perkMod >= 0 ? "+" + perkMod : perkMod}`;
      containerEl.classList.add("data-tooltip"); // Add tooltip class
    }
  });
}
//------------------------
//Hitpoints
function renderHP(creature, attribute, perk) {
  const hpEl = document.getElementById("hp-out"); // StatValue only
  const rowEl = document.getElementById("hp-row");
  const baseHP = creature.hp?.average ?? null;
  if (!baseHP) {
    hpEl.innerHTML = "N/A";
    return;
  }
  const attrMult = attribute.hpMult ?? 1;
  const perkMult = perk.hpMult ?? 1;
  const finalHP = Math.round(baseHP * attrMult * perkMult);
  hpEl.innerHTML = finalHP;
  // Determine delta
  const delta = finalHP - baseHP;
  // VALUE COLOURING
  if (delta > 0) {
    hpEl.classList.add("AbtlyPointIncrease", "AbtlyIncrease");
  } else if (delta < 0) {
    hpEl.classList.add("AbtlyPointDecrease", "AbtlyDecrease");
  }
  // TOOLTIP — ONLY IF THERE IS A CHANGE
  if (delta !== 0) {
    rowEl.dataset.tooltip =
      `Base (${creature.name}): ${baseHP}\n` +
      `${attribute.name}: x${attrMult}\n` +
      `${perk.name}: x${perkMult}`;
    rowEl.classList.add("data-tooltip");
  }
}
//------------------------
//Armour Class
function renderAC(creature, attribute, perk) {
  const acEl = document.getElementById("ac-out");
  const rowEl = document.getElementById("ac-row"); // Tooltip host
  // Extract base AC safely
  const baseAC = creature.ac?.[0]?.ac ?? creature.ac?.[0] ?? null;
  if (!baseAC) {
    acEl.innerHTML = "-";
    return;
  }
  const attrMod = attribute.acMod ?? 0;
  const perkMod = perk.acMod ?? 0;
  const finalAC = baseAC + attrMod + perkMod;
  acEl.innerHTML = finalAC;
  // Determine delta
  const delta = finalAC - baseAC;
  // VALUE COLOURING
  if (delta > 0) {
    acEl.classList.add("AbtlyPointIncrease", "AbtlyIncrease");
  } else if (delta < 0) {
    acEl.classList.add("AbtlyPointDecrease", "AbtlyDecrease");
  }
  // TOOLTIP — ONLY IF THERE IS A CHANGE
  if (delta !== 0) {
    rowEl.dataset.tooltip =
      `Base (${creature.name}): ${baseAC}\n` +
      `${attribute.name}: ${attrMod >= 0 ? "+" + attrMod : attrMod}\n` +
      `${perk.name}: ${perkMod >= 0 ? "+" + perkMod : perkMod}`;
    rowEl.classList.add("data-tooltip");
  }
}
//------------------------
// Speed Normaliser
function norm(val) {
  if (typeof val === "number") return { number: val, condition: null };
  if (val && typeof val === "object") {
    return { number: val.number ?? 0, condition: val.condition ?? null };
  }
  return { number: 0, condition: null };
}
//------------------------
// Speed formatter
function formatSpeed(speed) {
  if (!speed) return "-";
  const parts = [];
  const types = ["walk", "fly", "swim", "climb", "burrow"];
  types.forEach((type) => {
    const raw = speed[type];
    if (!raw) return;
    const num = typeof raw === "number" ? raw : raw.number;
    const cond = typeof raw === "object" ? raw.condition : null;
    let str = type === "walk" ? `${num} ft.` : `${type} ${num} ft.`;
    if (cond) str += ` ${cond}`;
    parts.push(str);
  });
  return parts.join(", ");
}
//------------------------
// Speed Calculator
function renderSpeed(creature, attribute, perk) {
  const outEl = document.getElementById("speed-out");
  const rowEl = document.getElementById("speed-row");
  const base = creature.speed ?? {};
  const attr = attribute.speedMods ?? {};
  const perkMods = perk.speedMods ?? {};
  const types = ["walk", "fly", "swim", "climb", "burrow"];
  const final = {};
  let changed = false;
  types.forEach((type) => {
    const b = norm(base[type]);
    const a = attr[type] ?? 0;
    const p = perkMods[type] ?? 0;
    const total = b.number + a + p;
    if (total > 0) {
      final[type] = b.condition
        ? { number: total, condition: b.condition }
        : total;
    }
    if (a !== 0 || p !== 0) changed = true;
  });
  // preserve hover flag
  if (base.canHover) final.canHover = true;
  // render
  outEl.innerHTML = formatSpeed(final);
  // tooltip
  if (changed) {
    outEl.classList.add("AbtlyChange", "AbtlyPointChange");
    let tooltip = "Movement:\n";
    types.forEach((type) => {
      const b = norm(base[type]);
      const a = attr[type] ?? 0;
      const p = perkMods[type] ?? 0;
      const total = b.number + a + p;
      if (b.number || a || p) {
        let line = `${type}: ${total} (${b.number} + ${a} + ${p})`;
        if (b.condition) line += ` ${b.condition}`;
        tooltip += line + "\n";
      }
    });
    rowEl.dataset.tooltip = tooltip.trim();
    rowEl.classList.add("data-tooltip");
  }
}
/*
-
-Saving Throws:
-
-Skills:
-
-Senses:
-
*/
//------------------------
// MERGE LISTS
function mergeListString(base = [], attr = [], perk = []) {
  const merged = new Set([...base, ...attr, ...perk]);
  return Array.from(merged).sort();
}
//------------------------
// NORMALIZE LIST TO FLAT STRING ARRAY
function normalizeList(list) {
  // Ensure we always work with an array
  if (list == null) list = [];
  if (!Array.isArray(list)) list = [list];
  const out = [];
  list.forEach((item) => {
    // Case 1: simple string
    if (typeof item === "string") {
      out.push(item);
      return;
    }
    // Case 2: damage-type object (resist, immune, vulnerable)
    if (item && typeof item === "object") {
      if (Array.isArray(item.resist)) {
        const note = item.note ? ` (${item.note})` : "";
        item.resist.forEach((type) => out.push(type + note));
        return;
      }
      if (Array.isArray(item.immune)) {
        const note = item.note ? ` (${item.note})` : "";
        item.immune.forEach((type) => out.push(type + note));
        return;
      }
      if (Array.isArray(item.vulnerable)) {
        const note = item.note ? ` (${item.note})` : "";
        item.vulnerable.forEach((type) => out.push(type + note));
        return;
      }
    }
    // Fallback — stringify safely
    out.push(String(item));
  });
  return out;
}
//------------------------
// RENDER LIST (generic)
function renderList({
  base = [],
  attr = [],
  perk = [],
  outId,
  rowId,
  attrLabel,
  perkLabel,
}) {
  const outEl = document.getElementById(outId);
  const rowEl = document.getElementById(rowId);
  // If the DOM element is missing, abort safely
  if (!outEl || !rowEl) {
    console.warn("renderList: missing element(s) for", outId, rowId);
    return;
  }
  // Normalize everything to flat string arrays
  const baseNorm = normalizeList(base);
  const attrNorm = normalizeList(attr);
  const perkNorm = normalizeList(perk);
  // Merge
  const finalList = mergeListString(baseNorm, attrNorm, perkNorm);
  // Render
  const formatted = formatDamageListFor5e(finalList);
  outEl.innerHTML = formatted || "-";
  // Detect changes (compare to normalized base)
  const changed =
    finalList.length !== baseNorm.length ||
    !finalList.every((v) => baseNorm.includes(v));
  if (changed) {
    outEl.classList.add("AbtlyPointIncrease", "AbtlyIncrease");
    let tooltip = "Changes:\n";
    if (attrNorm.length > 0)
      tooltip += `${attrLabel}: +${attrNorm.join(", ")}\n`;
    if (perkNorm.length > 0)
      tooltip += `${perkLabel}: +${perkNorm.join(", ")}\n`;
    rowEl.dataset.tooltip = tooltip.trim();
    rowEl.classList.add("data-tooltip");
  }
}
function formatDamageListFor5e(flatList) {
  const simple = [];
  const groups = {};
  flatList.forEach((item) => {
    const match = item.match(/^(.*)\s+\((.*)\)$/);
    if (!match) {
      simple.push(item);
      return;
    }
    const type = match[1];
    const note = match[2];
    if (!groups[note]) groups[note] = [];
    groups[note].push(type);
  });
  const parts = [];
  if (simple.length > 0) {
    parts.push(simple.join(", "));
  }
  Object.entries(groups).forEach(([note, types]) => {
    if (types.length === 1) {
      parts.push(`${types[0]} (${note})`);
    } else if (types.length === 2) {
      parts.push(`${types[0]} and ${types[1]} (${note})`);
    } else {
      const last = types.pop();
      parts.push(`${types.join(", ")}, and ${last} (${note})`);
    }
  });
  return parts.join("; ");
}
/*
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
*/
//------------------------
// RENDER STATS
function renderStats(creature, attribute, perk) {
  // Size
  // Saves
  // Skills
  // Senses
  const senses = creature.senses ? datacleanse(creature.senses) : "";
  const passive = creature.passive
    ? `passive perception: ${creature.passive}`
    : "";
  const sensesOut =
    senses && passive ? `${senses}, ${passive}` : senses || passive || "-";
  $("senses-out").innerHTML = sensesOut;
  // Damage / Condition / Languages
  //$("vulnerable-out").innerHTML = safe(creature.vulnerable);
  $("immune-out").innerHTML = safe(creature.immune);
  $("conditionImmune-out").innerHTML = safe(creature.conditionImmune);
  $("languages-out").innerHTML = safe(creature.languages);
}
//------------------------
// Render Traits
function renderTraits(creature) {
  const traitcontainer = $("traits-container");
  traitcontainer.innerHTML = "";
  const traits = creature.trait || [];
  if (!traits.length) {
    traitcontainer.innerHTML = "<p>No traits.</p>";
    traitcontainer.classList.add("creatureBlock");
    return;
  }
  traits.forEach((trait) => {
    const wrapper = el("div", "BlockItem");
    const title = el("span", "creatureBold", trait.name);
    const desc = el(
      "span",
      "creatureBlock",
      trait.entries.map((entry) => `${datacleanse(entry)}`).join("")
    );
    wrapper.appendChild(title);
    wrapper.appendChild(desc);
    traitcontainer.appendChild(wrapper);
  });
}
//------------------------
// RENDER ACTIONS
function renderActions(creature) {
  const actioncontainer = $("actions-container");
  actioncontainer.innerHTML = "";
  const actions = creature.action || [];
  if (!actions.length) {
    actioncontainer.innerHTML = "<p>No actions.</p>";
    actioncontainer.classList.add("creatureBlock");
    return;
  }
  actions.forEach((action) => {
    const wrapper = el("div", "BlockItem");
    const title = el("span", "creatureBold", datacleanse(action.name));
    const desc = el(
      "span",
      "creatureBlock",
      action.entries.map((entry) => `${datacleanse(entry)}`).join("")
    );
    wrapper.appendChild(title);
    wrapper.appendChild(desc);
    actioncontainer.appendChild(wrapper);
  });
}
/*
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
*/
//------------------------
//Data Clenser
function datacleanse(rawdata) {
  var datacleanse = JSON.stringify(rawdata)
    //.replace(/\\/g, "")
    //.replace(/\{@scaledamage.*\|.*\|/g, "")
    .replace(/\{@quickref /g, "") //Related to quick ref
    //.replace(/\{@item /g, "")
    //.replace(/\{@italic /g, "")
    //.replace(/, immune\[/, "; ")
    //.replace(/, note/, " ")
    //.replace(/, condtrue/, "")
    //.replace(/\{@/g, "")
    //.replace(/:/g, "")
    //.replace(/\+/g, " +")
    //.replace(/\|.*\|/g, "")
    //.replace(/\|/g, "")
    //.replace(/\{/g, "")
    //--------------
    .replace(/\{@status/g, "")
    .replace(/\{@condition/g, "")
    .replace(/\{@dc/g, "DC")
    .replace(/\{@hazard/g, "")
    .replace(/\{@damage /g, "")
    .replace(/\{@skill /g, "")
    //--------------
    .replace(/\{@spell/g, "") //Remove Spell Tag
    .replace(/\\?\{@recharge\s*([0-9]+|X)\}/gi, "(Recharge $1)") //Recharge Tags
    //--------------
    .replace(/\{@variantrule/g, "")
    .replace(/\|XGE/g, "")
    .replace(/\|XPHB/g, "")
    .replace(/\|phb}/g, "")
    .replace(/\|\|3/g, "") //Related to quick ref
    //--------------
    .replace(/\{@atkr m\}/g, "Melee Attack Roll:")
    .replace(/\{@atkr r\}/g, "Ranged Attack Roll:")
    .replace(/\{@atk mw\}/g, "Melee Weapon Attack:")
    .replace(/\{@atk rw\}/g, "Ranged Weapon Attack:")
    .replace(/\{@atk mw,rw\}/g, "Melee or Ranged Weapon Attack:")
    .replace(/\{@atk ms\}/g, "Melee Spell Attack:")
    .replace(/\{@atk rs\}/g, "Ranged Spell Attack:")
    .replace(/\{@atk ms,rs\}/g, "Melee or Ranged Spell Attack:")
    .replace(/\{@hit/g, "+") //Modifier To Hit
    .replace(/\{@h\}/g, "Hit: ") //To Hit
    .replace(/\{@dice /g, "") //Dice Related
    //--------------
    .replace(/\{@actSaveFail/g, "Failure: ") //Failed saving throw
    //--------------
    .replace(/\{@actSave str/g, "Str Saving Throw: ") //Str Save
    .replace(/\{@actSave dex/g, "Dex Saving Throw:") //Dex Save
    .replace(/\{@actSave con/g, "Con Saving Throw:") //Con Save
    .replace(/\{@actSave int/g, "Int Saving Throw:") //Int Save
    .replace(/\{@actSave wis/g, "Wis Saving Throw:") //Wis Save
    .replace(/\{@actSave cha/g, "Cha Saving Throw:") //Cha Save
    //--------------
    .replace(/\[/g, "") //Leading Square brace removal
    .replace(/\]/g, "") //Trailing Square Brace Removal
    .replace(/\}/g, "") //Trailing Curled Brace Removal
    .replace(/,/g, ", ") //Add space after comma
    .replace(/"/g, ""); //Remove Quotes around row
  return datacleanse;
}
//------------------------
//Function Check Header Row
function checkheader(header) {
  var headerout = "";
  var lookup = {
    "": "Error",
    saves: "Saving Throws:",
    skills: "Skills:",
    resist: "Damage Resistances:",
    immune: "Damage Immunities:",
    vulnerable: "Damage Vulnerabilities:",
    conditionImmune: "Condition Immunities:",
    senses: "Senses:",
    languages: "Languages:",
    innateHeaderEntry: "Innate:",
    spellHeaderEntry: "Spellcasting:",
    atWill: "At will: ",
    daily1: "1/Day: ",
    daily1e: "1/Day Each: ",
    daily2e: "2/Day Each: ",
    daily3e: "3/Day Each: ",
    cantrip: "Cantrips (at will): ",
    lvl0slots: "Cantrips (at will): ",
    lvl1slots: "1st Level (",
    lvl2slots: "2nd Level (",
    lvl3slots: "3rd Level (",
    lvl4slots: "4th Level (",
    lvl5slots: "5th Level (",
    lvl6slots: "6th Level (",
    lvl7slots: "7th Level (",
    lvl8slots: "8th Level (",
    lvl9slots: "9th Level (",
  };
  headerout = lookup[header];
  return headerout;
}

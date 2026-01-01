/*------------------------
0. Contents
------------------------
1. Bootstrapping & Global State
2. Core Helpers
3. Randomizers
4. Orchestrator
5. High‑level Rendering Blocks
6. Stats & Core Mechanics
7. Defence Block
8. List Utilities
9. Traits, Actions & Reactions
10. Spellcasting
11. Data Cleansing & Header Helpers
------------------------
****************************************************
------------------------
1. Bootstrapping & Global State
------------------------*/
window.addEventListener("DOMContentLoaded", loadSources);
async function loadSources() {
  console.log("Artificer: Summoning sources...");
  try {
    const [creaturesRes, attributesRes, perksRes, booksRes] = await Promise.all(
      [
        fetch("/api/creatures"),
        fetch("/Data/attributes.json"),
        fetch("/Data/perks.json"),
        fetch("/api/books"),
      ]
    );
    if (!creaturesRes.ok || !attributesRes.ok || !perksRes.ok || !booksRes.ok) {
      throw new Error("One or more source files failed to load.");
    }
    const [creatures, attributes, perks, books] = await Promise.all([
      creaturesRes.json(),
      attributesRes.json(),
      perksRes.json(),
      booksRes.json(),
    ]);
    if (
      !Array.isArray(creatures) ||
      !Array.isArray(attributes) ||
      !Array.isArray(perks) ||
      !Array.isArray(books)
    ) {
      throw new Error("Source data is malformed.");
    }
    Sources.creatures = creatures;
    Sources.attributes = attributes;
    Sources.perks = perks;
    Sources.books = books;
    console.log("Artificer: All sources loaded.");
    generateMonster();
  } catch (err) {
    console.error("Artificer: Source loading failed!", err);
    const nameOut = document.getElementById("name-out");
    if (nameOut) {
      nameOut.textContent = "Failed to load sources.";
    }
  }
}
/*------------------------
2. Core Helpers
------------------------*/
let Sources = {
  attributes: [],
  creatures: [],
  perks: [],
};
//------
const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) console.warn(`Wizard: Element #${id} not found.`);
  return el;
};
//------
const el = (tag, classNames = [], text = "") => {
  const node = document.createElement(tag);
  if (typeof classNames === "string") {
    node.classList.add(classNames);
  } else if (Array.isArray(classNames)) {
    node.classList.add(...classNames);
  }
  if (text) node.textContent = text;
  return node;
};
//------
const setText = (id, text) => {
  const el = $(id);
  if (el) el.textContent = text;
};
//------
const setSrc = (id, path) => {
  const el = $(id);
  if (el) el.src = path;
};
//------
const safe = (value) => (value != null ? String(value) : "-");
//------
function applyTooltip(el, text) {
  if (!el) return;
  el.dataset.tooltip = text;
  el.classList.add("data-tooltip");
}
//------
function getBookBySourceCode(code) {
  if (!Sources.books || !Array.isArray(Sources.books)) return null;
  return Sources.books.find((b) => b.id === code) || null;
}
//------
function applyValueHighlight(el, delta) {
  if (!el) return;
  if (delta > 0) el.classList.add("ability-point-increase");
  else if (delta < 0) el.classList.add("ability-point-decrease");
}
function applyLabelHighlight(el, delta) {
  if (!el) return;
  if (delta > 0) el.classList.add("ability-increase");
  else if (delta < 0) el.classList.add("ability-decrease");
}
function applyChangeHighlight(el) {
  if (!el) return;
  el.classList.add("ability-change", "ability-point-change");
}
/*------------------------
3. Randomizers
------------------------*/
function getRandomItem(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
/*------------------------
4. Orchestrator
------------------------*/
function generateMonster() {
  //const creature = Sources.creatures.find((c) => c.name === "Gwen The Bard");
  const creature = getRandomItem(Sources.creatures);
  const attribute = getRandomItem(Sources.attributes);
  const perk = getRandomItem(Sources.perks);
  console.log("Picked:", {
    attribute: attribute,
    creature: creature,
    perk: perk,
  });
  //------
  renderImageNameBlock(creature, attribute, perk);
  //------
  renderAlignment(creature);
  $("size-out").innerHTML = checksize(creature.size);
  //------
  const finalStats = calculateFinalStats(creature, attribute, perk);
  renderStatBlock(finalStats, creature, attribute, perk);
  //------
  renderHP(creature, attribute, perk);
  //------
  renderAC(creature, attribute, perk);
  //------
  renderSpeed(creature, attribute, perk);
  //------
  $("cr-out").innerHTML = creature.cr;

  //------
  $("saves-out").innerHTML = creature.save
    ? Object.entries(creature.save)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    : "-";
  //------
  renderSkills(creature, attribute, perk);
  //------
  const senses = creature.senses ? datacleanse(creature.senses) : "";
  const passive = creature.passive
    ? `passive perception: ${creature.passive}`
    : "";
  const sensesOut =
    senses && passive ? `${senses}, ${passive}` : senses || passive || "-";
  $("senses-out").innerHTML = sensesOut;
  //------
  $("languages-out").innerHTML = safe(creature.languages);
  //------
  renderList({
    base: normalizeList(creature.vulnerable),
    attr: normalizeList(attribute.vulnerable),
    perk: normalizeList(perk.vulnerable),
    outId: "vulnerable-out",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  //------
  renderList({
    base: normalizeList(creature.resist),
    attr: normalizeList(attribute.resist),
    perk: normalizeList(perk.resist),
    outId: "resist-out",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  //------
  renderList({
    base: normalizeList(creature.immune),
    attr: normalizeList(attribute.immune),
    perk: normalizeList(perk.immune),
    outId: "immune-out",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  //------
  renderList({
    base: normalizeList(creature.conditionImmune),
    attr: normalizeList(attribute.conditionImmune),
    perk: normalizeList(perk.conditionImmune),
    outId: "conditionImmune-out",
    attrLabel: attribute.prefix,
    perkLabel: perk.name,
  });
  //------
  renderTraits(creature, attribute, perk);
  //------
  renderActions(creature, attribute, perk);
  //------
  renderSpellcasting(creature);
  //------
  renderReactions(creature);
  //------
  $("source-out").innerHTML = creature.source.toUpperCase();
  $("page-out").innerHTML = "Page: " + creature.page;
  const book = getBookBySourceCode(creature.source);
  if (book) {
    applyTooltip($("source-container"), `${book.name}`);
  }
  //------
  if (!attribute || !creature || !perk) {
    alert("Sources not loaded yet!");
    return;
  }
  //-----------------------------------------
  tippy(".data-tooltip", {
    content(reference) {
      return reference.dataset.tooltip;
    },
    allowHTML: false,
    placement: "top",
    animation: "shift-away",
    theme: "light-border",
  });
}
/*------------------------
5. High‑level Rendering Blocks
------------------------*/
function renderImageNameBlock(creature, attribute, perk) {
  setSrc("creature-media-image", `/Assets/Creatures/${creature.name}.webp`);
  setSrc("attribute-icon-out", `/Assets/Icons/Attribute/${attribute.name}.png`);
  setText("attribute-out", attribute.name);
  //------------------------
  const typeName = creature.type.type ?? creature.type;
  setText("type-out", typeName);
  setSrc("type-icon-out", `/Assets/Icons/Type/${typeName}.png`);
  //------------------------
  const tags = creature.type.tags ? ` (${creature.type.tags})` : "";
  setText("tags-out", tags);
  //------------------------
  setSrc("perk-icon-out", `/Assets/Icons/Perk/${perk.name}.png`);
  setText("perk-out", perk.name);
  //------------------------
  setText(
    "name-out",
    `${attribute.prefix} ${creature.name} ${perk.descriptor}`
  );
  //------------------------
  setText(
    "desc-out",
    `This ${creature.name} was ${attribute.origin} It is ${perk.origin}.`
  );
}
//------------------------
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
function renderAlignment(creature) {
  const alignment = formatAlignment(creature.alignment || []);
  $("alignment-out").innerHTML = alignment;
  $("alignment-out").classList.add(alignment.replace(/\s/g, ""));
}
//------------------------
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
/*------------------------
6. Stats & Core Mechanics
------------------------*/
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
function checkstatrole(modifier) {
  var output = Math.floor((modifier - 10) / 2);
  var symbol = "";
  if (output >= 0) {
    symbol = "+";
  }
  return modifier + " (" + symbol + output + ")";
}
//------------------------
function renderStatBlock(finalStats, creature, attribute, perk) {
  Object.entries(finalStats).forEach(([stat, data]) => {
    const valueEl = document.getElementById(`${stat.toUpperCase()}-out`);
    const labelEl = document.getElementById(`${stat.toUpperCase()}-label`);
    const containerEl = document.getElementById(
      `${stat.toUpperCase()}-Container`
    );
    applyValueHighlight(valueEl, data.delta);
    applyLabelHighlight(labelEl, data.delta);
    valueEl.textContent = checkstatrole(data.final);
    if (data.delta !== 0) {
      const attrMod = attribute.statMods?.[stat] ?? 0;
      const perkMod = perk.statMods?.[stat] ?? 0;
      const tooltip =
        `${creature.name} (Base): ${data.base}\n` +
        `${attribute.prefix}: ${attrMod >= 0 ? "+" + attrMod : attrMod}\n` +
        `${perk.name}: ${perkMod >= 0 ? "+" + perkMod : perkMod}`;
      applyTooltip(containerEl, tooltip);
    }
  });
}
/*------------------------
7. Defence Block
------------------------*/
function renderAC(creature, attribute, perk) {
  const acEl = document.getElementById("ac-out");
  const baseAC = creature.ac?.[0]?.ac ?? creature.ac?.[0] ?? null;
  if (!baseAC) {
    acEl.textContent = "-";
    return;
  }
  const attrMod = attribute.acMod ?? 0;
  const perkMod = perk.acMod ?? 0;
  const finalAC = baseAC + attrMod + perkMod;
  const delta = finalAC - baseAC;
  acEl.textContent = finalAC;
  applyValueHighlight(acEl, delta);
  applyLabelHighlight(acEl, delta);
  if (delta !== 0) {
    const tooltip =
      `${creature.name} (Base): ${baseAC}\n` +
      `${attribute.name}: ${attrMod >= 0 ? "+" + attrMod : attrMod}\n` +
      `${perk.name}: ${perkMod >= 0 ? "+" + perkMod : perkMod}`;
    applyTooltip(acEl, tooltip);
  }
}
//------------------------
function renderHP(creature, attribute, perk) {
  const hpEl = document.getElementById("hp-out");
  const baseHP = creature.hp?.average ?? null;
  if (!baseHP) {
    hpEl.textContent = "N/A";
    return;
  }
  const attrMult = attribute.hpMult ?? 1;
  const perkMult = perk.hpMult ?? 1;
  const finalHP = Math.round(baseHP * attrMult * perkMult);
  const delta = finalHP - baseHP;
  hpEl.textContent = finalHP;
  applyValueHighlight(hpEl, delta);
  applyLabelHighlight(hpEl, delta);
  if (delta !== 0) {
    const tooltip =
      `${creature.name} (Base): ${baseHP}\n` +
      `${attribute.name}: x${attrMult}\n` +
      `${perk.name}: x${perkMult}`;
    applyTooltip(hpEl, tooltip);
  }
}
//------------------------
function norm(val) {
  if (typeof val === "number") return { number: val, condition: null };
  if (val && typeof val === "object") {
    return { number: val.number ?? 0, condition: val.condition ?? null };
  }
  return { number: 0, condition: null };
}
//------------------------
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
function renderSpeed(creature, attribute, perk) {
  const outEl = document.getElementById("speed-out");
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
  if (base.canHover) final.canHover = true;
  outEl.textContent = formatSpeed(final);
  if (changed) {
    applyChangeHighlight(outEl);
    let tooltip = `Movement:\nBase + ${attribute.prefix} + ${perk.name}\n\n`;
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
    applyTooltip(outEl, tooltip.trim());
  }
}
//------------------------
function calculateFinalSkills(creature, attribute, perk) {
  const baseSkills = creature.skill || {};
  const attrMods = attribute.skillMods || {};
  const perkMods = perk.skillMods || {};
  const allSkills = new Set([
    ...Object.keys(baseSkills),
    ...Object.keys(attrMods),
    ...Object.keys(perkMods),
  ]);
  const final = {};
  const breakdown = {};
  allSkills.forEach((skill) => {
    const baseVal = baseSkills[skill] ? parseInt(baseSkills[skill], 10) : 0;
    const a = attrMods[skill] ?? 0;
    const p = perkMods[skill] ?? 0;
    const total = baseVal + a + p;
    if (total !== 0) {
      final[skill] = (total >= 0 ? "+" : "") + total;
      breakdown[skill] = { base: baseVal, attr: a, perk: p, total };
    }
  });
  return { final, breakdown };
}
//------------------------
function renderSkills(creature, attribute, perk) {
  const outEl = document.getElementById("skills-out");
  const { final, breakdown } = calculateFinalSkills(creature, attribute, perk);
  const entries = Object.entries(final)
    .map(([skill, value]) => `${skill}: ${value}`)
    .join(", ");
  outEl.textContent = entries || "-";
  const changed = Object.values(breakdown).some(
    (b) => b.attr !== 0 || b.perk !== 0
  );
  if (changed) {
    applyChangeHighlight(outEl);
    let tooltip = `Skills:\nBase + ${attribute.prefix} + ${perk.name}\n\n`;
    Object.entries(breakdown).forEach(([skill, b]) => {
      tooltip += `${skill}: ${b.total} (${b.base} + ${b.attr} + ${b.perk})\n`;
    });
    applyTooltip(outEl, tooltip.trim());
  }
}
/*------------------------
8. List Utilities
------------------------*/
function mergeListString(base = [], attr = [], perk = []) {
  const merged = new Set([...base, ...attr, ...perk]);
  return Array.from(merged).sort();
}
//------------------------
function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach((item) => {
    if (typeof item === "string") {
      out.push(item);
      return;
    }
    if (item && typeof item === "object") {
      const keys = ["resist", "immune", "vulnerable"];
      const key = keys.find((k) => Array.isArray(item[k]));
      if (key) {
        const note = item.note ? ` (${item.note})` : "";
        item[key].forEach((type) => out.push(type + note));
        return;
      }
    }
    out.push(String(item));
  });
  return out;
}
//------------------------
function renderList({
  base = [],
  attr = [],
  perk = [],
  outId,
  attrLabel,
  perkLabel,
}) {
  const outEl = document.getElementById(outId);
  const finalList = mergeListString(base, attr, perk);
  outEl.textContent = finalList.length > 0 ? finalList.join(", ") : "-";
  const changed =
    finalList.length !== base.length ||
    !finalList.every((v) => base.includes(v));
  if (changed) {
    applyChangeHighlight(outEl);
    let tooltip = "Changes:\n";
    if (attr.length > 0) tooltip += `${attrLabel}: +${attr.join(", ")}\n`;
    if (perk.length > 0) tooltip += `${perkLabel}: +${perk.join(", ")}\n`;
    applyTooltip(outEl, tooltip.trim());
  }
}
/*------------------------
9. Traits, Actions & Reactions
------------------------*/
function collectAllTraits(creature, attribute, perk) {
  const creatureTraits = creature.trait || [];
  const attributeTraits = attribute.traits || [];
  const perkTraits = perk.traits || [];
  return [
    ...attributeTraits.map((t) => ({ ...t, source: attribute.prefix })),
    ...perkTraits.map((t) => ({ ...t, source: perk.name })),
    ...creatureTraits.map((t) => ({ ...t, source: "Creature" })),
  ];
}
//------------------------
function collectAllActions(creature, attribute, perk) {
  const creatureActions = creature.action || [];
  const attributeActions = attribute.actions || [];
  const perkActions = perk.actions || [];
  return [
    ...attributeActions.map((a) => ({ ...a, source: attribute.prefix })),
    ...perkActions.map((a) => ({ ...a, source: perk.name })),
    ...creatureActions.map((a) => ({ ...a, source: "Creature" })),
  ];
}
//------------------------
function renderEntryList(containerId, entries, emptyText) {
  const container = $(containerId);
  container.innerHTML = "";
  if (!entries.length) {
    container.appendChild(el("div", "category-body", emptyText));
    return;
  }
  entries.forEach((entry) => {
    const title = el("div", "category-header", datacleanse(entry.name));
    if (entry.source && entry.source !== "Creature") {
      applyChangeHighlight(title);
      applyTooltip(title, `Source: ${entry.source}`);
    }
    const desc = el(
      "div",
      "category-body",
      entry.entries.map((e) => datacleanse(e)).join("")
    );
    container.appendChild(title);
    container.appendChild(desc);
  });
}
//------------------------
function renderTraits(creature, attribute, perk) {
  const traits = collectAllTraits(creature, attribute, perk);
  renderEntryList("traits-container", traits, "No traits.");
}
//------------------------
function renderActions(creature, attribute, perk) {
  const actions = collectAllActions(creature, attribute, perk);
  renderEntryList("actions-container", actions, "No actions.");
}
//------------------------
function renderReactions(creature) {
  const reactions = creature.reaction || [];
  renderEntryList("reactions-container", reactions, "No reactions.");
}
/*------------------------
10. Spellcasting
------------------------*/
function collectSpellcasting(creature) {
  return creature.spellcasting || [];
}
//------------------------
function renderSpellcasting(creature) {
  const container = $("spellcasting-container");
  container.innerHTML = "";
  const blocks = creature.spellcasting || [];
  if (!blocks.length) {
    container.appendChild(el("div", "category-body", "No spellcasting."));
    return;
  }
  blocks.forEach((block) => {
    // -----------------------------------
    // 1. SPELLCASTING HEADER
    // -----------------------------------
    const title = el("div", "category-header", datacleanse(block.name) + ".");
    container.appendChild(title);
    if (block.headerEntries) {
      const headerText = el(
        "div",
        "category-body",
        block.headerEntries.map((e) => datacleanse(e)).join(" ")
      );
      container.appendChild(headerText);
    }
    // -----------------------------------
    // 2. INNATE: AT WILL
    // -----------------------------------
    if (block.will) {
      const label = el("div", "category-header", checkheader("atWill"));
      const list = el(
        "div",
        "category-body",
        block.will.map((s) => datacleanse(s)).join(", ")
      );
      container.appendChild(label);
      container.appendChild(list);
    }
    // -----------------------------------
    // 3. INNATE: DAILY USES
    // -----------------------------------
    if (block.daily) {
      Object.entries(block.daily).forEach(([key, spells]) => {
        const label = el("div", "category-header", checkheader(`daily${key}`));
        const list = el(
          "div",
          "category-body",
          spells.map((s) => datacleanse(s)).join(", ")
        );
        container.appendChild(label);
        container.appendChild(list);
      });
    }
    // -----------------------------------
    // 4. PREPARED SPELLCASTING
    // -----------------------------------
    if (block.spells) {
      Object.entries(block.spells).forEach(([level, data]) => {
        const headerKey = level === "0" ? "lvl0slots" : `lvl${level}slots`;
        let labelText = checkheader(headerKey);
        if (data.slots != null) {
          labelText = `${labelText}${data.slots} slots:`;
        }
        const label = el("div", "category-header", labelText);
        const list = el(
          "div",
          "category-body",
          data.spells.map((s) => datacleanse(s)).join(", ")
        );
        container.appendChild(label);
        container.appendChild(list);
      });
    }
  });
}
/*------------------------
11. Data Cleansing & Header Helpers
------------------------*/
function datacleanse(rawdata) {
  let text = typeof rawdata === "string" ? rawdata : JSON.stringify(rawdata);
  text = text
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
    .replace(/\{@actTrigger/g, "Trigger")
    .replace(/\{@actResponse/g, "Response")
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
  return text;
}
//------------------------
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

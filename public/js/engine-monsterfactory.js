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
async function initMonsterFactory() {
  try {
    const [creaturesRes, attributesRes, perksRes, booksRes] = await Promise.all(
      [
        fetch("/api/creatures"),
        fetch("/api/attributes"),
        fetch("/api/perks"),
        fetch("/api/books"),
      ],
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
    Sources.creatures = creatures;
    Sources.attributes = attributes;
    Sources.perks = perks;
    Sources.books = books;
    generateMonster(); // safe to run now
    return true;
  } catch (err) {
    console.error("Factory: Source loading failed!", err);
    const nameOut = document.getElementById("name-out");
    if (nameOut) nameOut.textContent = "Failed to load sources.";
    return false;
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
let activeTooltips = [];
//------
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
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
function clearTooltips() {
  // Destroy existing Tippy instances
  activeTooltips.forEach((tip) => tip.destroy());
  activeTooltips = [];
  // Remove tooltip attributes & classes from DOM
  document.querySelectorAll(".data-tooltip").forEach((el) => {
    el.removeAttribute("data-tooltip");
    el.classList.remove("data-tooltip");
  });
  // Remove all highlight classes
  document
    .querySelectorAll(
      ".ability-change, .ability-point-change, .ability-increase, .ability-decrease, .ability-point-increase, .ability-point-decrease",
    )
    .forEach((el) => {
      el.classList.remove(
        "ability-change",
        "ability-point-change",
        "ability-increase",
        "ability-decrease",
        "ability-point-increase",
        "ability-point-decrease",
      );
    });
}
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
function cleanseNameForFile(name) {
  return name.replace(/'/g, "");
}
/*------------------------
3. Drop Down Filters & Selectors
------------------------*/
function getSelected(id) {
  const el = document.getElementById(id);
  return el && el.value ? el.value : null;
}
document.getElementById("btn-generate").addEventListener("click", () => {
  const edition = getSelected("mf-edition");
  const cr = getSelected("mf-cr");
  const type = getSelected("mf-type");
  const attribute = getSelected("mf-attribute");
  const perk = getSelected("mf-perk");
  generateMonster({ edition, cr, type, attribute, perk });
});
document.getElementById("btn-random").addEventListener("click", () => {
  resetFilters();
  generateMonster(); // fully random
});
function resetFilters() {
  document.getElementById("mf-edition").value = "";
  document.getElementById("mf-cr").value = "";
  document.getElementById("mf-type").value = "";
  document.getElementById("mf-attribute").value = "";
  document.getElementById("mf-perk").value = "";
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
function generateMonster(options = {}) {
  const { edition, cr, type, attribute, perk } = options;
  // --- Resets ---
  clearTooltips();
  // --- CREATURE ---
  let creaturePool = Sources.creatures;
  if (edition) {
    creaturePool = creaturePool.filter((c) => c.edition === edition);
  }
  if (cr) {
    creaturePool = creaturePool.filter((c) => c.cr === cr);
  }
  if (type) {
    const normalised = type.toLowerCase();
    creaturePool = creaturePool.filter((c) => {
      const t = c.type?.type ?? c.type;
      return t.toLowerCase() === normalised;
    });
  }
  if (creaturePool.length === 0) {
    console.warn("No creature matched filters — falling back to random.");
    creaturePool = Sources.creatures;
  }
  const creature = getRandomItem(creaturePool);
  //const creature = Sources.creatures.find((c) => c.name === "Wereboar");
  // --- ATTRIBUTE ---
  const chosenAttribute = attribute
    ? Sources.attributes.find((a) => a.name === attribute)
    : getRandomItem(Sources.attributes);
  // --- PERK ---
  const chosenPerk = perk
    ? Sources.perks.find((p) => p.name === perk)
    : getRandomItem(Sources.perks);
  // --- RENDER ---
  renderImageNameBlock(creature, chosenAttribute, chosenPerk);
  //------
  renderAlignment(creature);
  $("size-out").innerHTML = checksize(creature.size);
  rednerEdition(creature);
  //------
  const finalStats = calculateFinalStats(creature, chosenAttribute, chosenPerk);
  renderStatBlock(finalStats, creature, chosenAttribute, chosenPerk);
  //------
  renderHP(creature, chosenAttribute, chosenPerk);
  //------
  renderAC(creature, chosenAttribute, chosenPerk);
  //------
  renderSpeed(creature, chosenAttribute, chosenPerk);
  //------
  $("cr-out").innerHTML = creature.cr;
  //------
  $("saves-out").innerHTML = creature.save
    ? Object.entries(creature.save)
        .map(([key, value]) => `${cap(key)}: ${value}`)
        .join(", ")
    : "-";
  //------
  renderSkills(creature, chosenAttribute, chosenPerk);
  //------
  const senses = creature.senses ? datacleanse(creature.senses) : "";
  const passive = creature.passive
    ? `${cap("passive")} ${cap("perception")}: ${creature.passive}`
    : "";
  const sensesOut =
    senses && passive ? `${cap(senses)}, ${passive}` : senses || passive || "-";
  $("senses-out").innerHTML = sensesOut;
  //------
  $("languages-out").innerHTML = safe(creature.languages);
  //------
  renderList({
    base: creature.vulnerable,
    attr: chosenAttribute.vulnerable,
    perk: chosenPerk.vulnerable,
    outId: "vulnerable-out",
    attrLabel: chosenAttribute.prefix,
    perkLabel: chosenPerk.name,
  });
  //------
  renderList({
    base: creature.resist,
    attr: chosenAttribute.resist,
    perk: chosenPerk.resist,
    outId: "resist-out",
    attrLabel: chosenAttribute.prefix,
    perkLabel: chosenPerk.name,
  });
  //------
  renderList({
    base: creature.immune,
    attr: chosenAttribute.immune,
    perk: chosenPerk.immune,
    outId: "immune-out",
    attrLabel: chosenAttribute.prefix,
    perkLabel: chosenPerk.name,
  });
  //------
  renderList({
    base: creature.conditionImmune,
    attr: chosenAttribute.conditionImmune,
    perk: chosenPerk.conditionImmune,
    outId: "conditionImmune-out",
    attrLabel: chosenAttribute.prefix,
    perkLabel: chosenPerk.name,
  });
  //------
  renderTraits(creature, chosenAttribute, chosenPerk);
  //------
  renderActions(creature, chosenAttribute, chosenPerk);
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
  if (!chosenAttribute || !creature || !chosenPerk) {
    alert("Sources not loaded yet!");
    return;
  }
  //-----------------------------------------
  const tips = tippy(".data-tooltip", {
    content(reference) {
      return reference.dataset.tooltip;
    },
    allowHTML: false,
    placement: "top",
    animation: "shift-away",
    theme: "light-border",
  });
  activeTooltips.push(...tips);
}
/*------------------------
5. High‑level Rendering Blocks
------------------------*/
function renderImageNameBlock(creature, attribute, perk) {
  const fileName = cleanseNameForFile(creature.name);
  setSrc("creature-media-image", `/images/creatures/${fileName}.webp`);
  setSrc(
    "attribute-icon-out",
    `/images/ui/icons/attribute/${attribute.name}.png`,
  );
  setText("attribute-out", attribute.name);
  //------------------------
  const typeName = creature.type.type ?? creature.type;
  setText("type-out", typeName);
  setSrc("type-icon-out", `/images/ui/icons/type/${typeName}.jpg`);
  //------------------------
  //const tags = creature.type.tags ? ` (${creature.type.tags})` : "";

  const tags = creature.type.tags?.length
    ? ` (${creature.type.tags.join(", ")})`
    : "";
  console.log(tags);
  setText("tags-out", tags);
  //------------------------
  setSrc("perk-icon-out", `/images/ui/icons/perk/${perk.name}.png`);
  setText("perk-out", perk.name);
  //------------------------
  setText(
    "name-out",
    `${attribute.prefix} ${creature.name} ${perk.descriptor}`,
  );
  //------------------------
  setText(
    "desc-out",
    `This ${creature.name} was ${attribute.origin} ${perk.origin}`,
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
function rednerEdition(creature) {
  $("edition-out").innerHTML = creature.edition + " ruleset";
  $("edition-out").classList.add("e" + creature.edition);
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
      `${stat.toUpperCase()}-Container`,
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
    .map(([skill, value]) => `${cap(skill)}: ${value}`)
    .join(", ");
  outEl.textContent = entries || "-";
  const changed = Object.values(breakdown).some(
    (b) => b.attr !== 0 || b.perk !== 0,
  );
  if (changed) {
    applyChangeHighlight(outEl);
    let tooltip = `Skills:\nBase + ${attribute.prefix} + ${perk.name}\n\n`;
    Object.entries(breakdown).forEach(([skill, b]) => {
      tooltip += `${cap(skill)}: ${b.total} (${b.base} + ${b.attr} + ${
        b.perk
      })\n`;
    });
    applyTooltip(outEl, tooltip.trim());
  }
}
/*------------------------
8. List Utilities
------------------------*/
function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  const simple = [];
  const grouped = [];
  list.forEach((item) => {
    if (typeof item === "string") {
      simple.push(cap(item));
      return;
    }
    if (item && typeof item === "object") {
      const keys = ["resist", "immune", "vulnerable"];
      const key = keys.find((k) => Array.isArray(item[k]));
      if (key) {
        grouped.push({
          types: item[key].map((t) => cap(t)),
          note: item.note || null,
        });
        return;
      }
    }
    simple.push(cap(String(item)));
  });
  return { simple, grouped };
}
//------------------------
function renderGroupedOutput({ simple, grouped }) {
  const parts = [];
  if (simple.length > 0) {
    const last = simple.pop();
    const simpleStr =
      simple.length > 0 ? `${simple.join(", ")}, and ${last}` : last;
    parts.push(simpleStr);
  }
  grouped.forEach((g) => {
    const last = g.types[g.types.length - 1];
    const rest = g.types.slice(0, -1).join(", ");
    const joined = rest ? `${rest}, and ${last}` : last;
    parts.push(g.note ? `${joined} ${g.note}` : joined);
  });
  return parts.join(" — ");
}
//------------------------
function renderList({ base = [], attr = [], perk = [], outId }) {
  const outEl = document.getElementById(outId);
  const baseNorm = normalizeList(base);
  const attrNorm = normalizeList(attr);
  const perkNorm = normalizeList(perk);
  const simple = [...baseNorm.simple, ...attrNorm.simple, ...perkNorm.simple];
  const grouped = [
    ...baseNorm.grouped,
    ...attrNorm.grouped,
    ...perkNorm.grouped,
  ];
  const output = renderGroupedOutput({ simple, grouped });
  outEl.textContent = output || "-";
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
    const desc = el("div", "category-body");
    entry.entries.forEach((e) => {
      const node = renderEntry(e);
      desc.appendChild(node);
    });
    container.appendChild(title);
    container.appendChild(desc);
  });
}
//------------------------
function renderEntry(entry) {
  if (entry == null) return document.createTextNode("");
  // STRING → text node
  if (typeof entry === "string") {
    return document.createTextNode(datacleanse(entry));
  }
  // LIST → <ul><li>...</li></ul>
  if (entry.type === "list" && Array.isArray(entry.items)) {
    const ul = document.createElement("ul");
    ul.classList.add("list-hang");
    entry.items.forEach((item) => {
      const li = document.createElement("li");
      if (item.name) {
        const strong = document.createElement("strong");
        strong.textContent = datacleanse(item.name) + ". ";
        li.appendChild(strong);
      }
      (item.entries || []).forEach((sub) => {
        li.appendChild(renderEntry(sub));
      });
      ul.appendChild(li);
    });
    return ul;
  }
  // ENTRIES BLOCK → <div>...</div>
  if (entry.type === "entries" && Array.isArray(entry.entries)) {
    const div = document.createElement("div");
    entry.entries.forEach((sub) => {
      div.appendChild(renderEntry(sub));
    });
    return div;
  }
  // FALLBACK → text node
  return document.createTextNode(datacleanse(String(entry)));
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
        block.headerEntries.map((e) => datacleanse(e)).join(" "),
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
        block.will.map((s) => datacleanse(s)).join(", "),
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
          spells.map((s) => datacleanse(s)).join(", "),
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
          labelText = `${labelText}${data.slots} slots):`;
        }
        const label = el("div", "category-header", labelText);
        const list = el(
          "div",
          "category-body",
          data.spells.map((s) => datacleanse(s)).join(", "),
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
/*function datacleanse(rawdata) {
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
    .replace(/\\?\{@chance\s*([0-9]+|X)\s*\}?/gi, "($1%)") //% Chances
    //--------------
    .replace(/\{@status/g, "")
    .replace(/\{@condition/g, "")
    .replace(/\{@dc/g, "DC")
    .replace(/\{@hazard/g, "")
    .replace(/\{@damage /g, "")
    .replace(/\{@skill /g, "")
    .replace(/\{@actTrigger/g, "Trigger")
    .replace(/\{@actResponse/g, "Response")
    .replace(/\{@creature /g, "")
    .replace(/\{@item /g, "") //Wears Item?
    //--------------
    .replace(/\{@spell/g, "") //Remove Spell Tag
    .replace(/\\?\{@recharge\s*([0-9]+|X)\}/gi, "(Recharge $1)") //Recharge Tags
    .replace(/concentration\s*\|+\s*concentrating/i, "concentrating")
    //--------------
    .replace(/\{@variantrule/g, "")
    .replace(/\|XGE/g, "")
    .replace(/\|LLK/g, "")
    .replace(/\|XPHB/g, "")
    .replace(/\|phb}/g, "")
    .replace(/\|\|3/g, "") //Related to quick ref
    //--------------
    .replace(/\{@atkr m\}/g, "Melee Attack Roll:")
    .replace(/\{@atkr r\}/g, "Ranged Attack Roll:")
    .replace(/\{@atkr m, r\}/g, "Melee or Ranged Attack Roll:")
    .replace(/\{@atk mw\}/g, "Melee Weapon Attack:")
    .replace(/\{@atk rw\}/g, "Ranged Weapon Attack:")
    .replace(/\{@atk mw,rw\}/g, "Melee or Ranged Weapon Attack:")
    .replace(/\{@atk ms\}/g, "Melee Spell Attack:")
    .replace(/\{@atk rs\}/g, "Ranged Spell Attack:")
    .replace(/\{@atk ms,rs\}/g, "Melee or Ranged Spell Attack:")
    .replace(/\{@hit/g, "+") //Modifier To Hit
    .replace(/\{@h\}/g, "Hit: ") //To Hit
    .replace(/\{@dice /g, "") //Dice Related
    .replace(/\{@action/g, "") //Action
    .replace(/\{@hom\}/g, "Hit or Miss:")
    //--------------
    .replace(/\{@actSaveFail/g, "Failure: ") //Failed saving throw
    .replace(/\{@actSaveSuccess/g, "Success: ") //Failed saving throw
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
}*/
// ------------------------------------------------------------
//  UTILITIES
// ------------------------------------------------------------
function firstPipePart(str) {
  return str.split("|")[0].trim();
}
function resolveFallbackSyntax(str) {
  if (!str.includes("||")) return str;
  const [primary, fallback] = str.split("||").map((s) => s.trim());
  return fallback || primary;
}
// ------------------------------------------------------------
//  TAG PARSER — replaces datacleanse()
// ------------------------------------------------------------
function cleanText(raw) {
  if (raw == null) return "";
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text.replace(/\{@([^}]+)\}/g, (full, inner) => {
    const [tag, ...rest] = inner.split(" ");
    const args = rest.join(" ").trim();
    return renderTag(tag, args);
  });
}
// ------------------------------------------------------------
//  TAG DISPATCHER
// ------------------------------------------------------------
function renderTag(tag, args) {
  args = resolveFallbackSyntax(args);
  switch (tag) {
    // Core combat tags
    case "atk":
      return renderAtk(args);
    case "atkr":
      return renderAtkRoll(args);
    case "hit":
      return `+${args}`;
    case "h":
      return "Hit: ";
    case "m":
      return "Miss: ";
    case "hom":
      return "Hit or Miss:";
    case "dc":
      return renderDc(args);
    // Saving throw tags
    case "actSave":
      return renderSave(args);
    case "actSaveFail":
      return "Failure:";
    case "actSaveSuccess":
      return "Success:";
    case "actTrigger":
      return "Trigger";
    case "actResponse":
      return "Response";
    // Conditions, statuses, creatures
    case "condition":
      return firstPipePart(args);
    case "status":
      return firstPipePart(args);
    case "creature":
      return firstPipePart(args);
    // Skills
    case "skill":
      return firstPipePart(args);
    // Items & spells
    case "spell":
      return firstPipePart(args);
    case "item":
      return firstPipePart(args);
    // Recharge, chance, scaling
    case "recharge":
      return renderRecharge(args);
    case "chance":
      return renderChance(args);
    case "scaledamage":
      return renderScaleDamage(args);
    // Damage dice
    case "damage":
      return args;
    // Quickref / variant rules
    case "quickref":
      return "";
    case "variantrule":
      return "";
    // Hazards
    case "hazard":
      return firstPipePart(args);
    // Ability scores
    case "ability":
      return args.toUpperCase();
    // Default fallback
    default:
      return args;
  }
}
// ------------------------------------------------------------
//  TAG HANDLERS
// ------------------------------------------------------------
function renderDc(args) {
  return `DC ${args}`;
}
function renderAtk(args) {
  switch (args) {
    case "mw":
      return "Melee Weapon Attack:";
    case "rw":
      return "Ranged Weapon Attack:";
    case "mw,rw":
      return "Melee or Ranged Weapon Attack:";
    case "ms":
      return "Melee Spell Attack:";
    case "rs":
      return "Ranged Spell Attack:";
    case "ms,rs":
      return "Melee or Ranged Spell Attack:";
    default:
      return "Attack:";
  }
}
function renderAtkRoll(args) {
  switch (args) {
    case "m":
      return "Melee Attack Roll:";
    case "r":
      return "Ranged Attack Roll:";
    case "m,r":
      return "Melee or Ranged Attack Roll:";
    default:
      return "Attack Roll:";
  }
}
function renderSave(args) {
  const map = {
    str: "Str Saving Throw:",
    dex: "Dex Saving Throw:",
    con: "Con Saving Throw:",
    int: "Int Saving Throw:",
    wis: "Wis Saving Throw:",
    cha: "Cha Saving Throw:",
  };
  return map[args] || "Saving Throw:";
}
function renderSpell(args) {
  return firstPipePart(args);
}
function renderItem(args) {
  return firstPipePart(args);
}
function renderRecharge(args) {
  return `(Recharge ${args})`;
}
function renderChance(args) {
  return `(${args}% Chance)`;
}
function renderScaleDamage(args) {
  // Example: {@scaledamage 2d6|1d6|3d6|5d6}
  const parts = args.split("|");
  return parts[0]; // Use base damage
}
// ------------------------------------------------------------
//  EXPORT
// ------------------------------------------------------------
function datacleanse(str) {
  return cleanText(str)
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/\}/g, "")
    .replace(/,/g, ", ")
    .replace(/"/g, "");
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

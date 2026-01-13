async function initContentViewer() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.querySelector(".content-wrapper").innerHTML =
      "<p>Creature not found.</p>";
    return;
  }

  const basePath = `/Assets/Curated/${id}`;

  try {
    // Load JSON
    const json = await fetch(`${basePath}/data.json`).then((r) => r.json());

    // Load Markdown
    const md = await fetch(`${basePath}/info.md`).then((r) => r.text());

    // Populate image
    document.getElementById("creatureImage").src = `${basePath}/image.png`;
    document.getElementById("creatureImage").alt = json.name || id;
    document.getElementById("mf-name").innerHTML = json.name;
    document.getElementById("mf-subtitle").innerHTML = json.subtitle;
    document.getElementById("mf-acclass").innerHTML = json.ac;
    document.getElementById("mf-hpclass").innerHTML = json.hp;
    document.getElementById("mf-speed").innerHTML = json.speed;
    document.getElementById("mf-str").innerHTML = json.str;
    document.getElementById("mf-dex").innerHTML = json.dex;
    document.getElementById("mf-con").innerHTML = json.con;
    document.getElementById("mf-int").innerHTML = json.int;
    document.getElementById("mf-wis").innerHTML = json.wis;
    document.getElementById("mf-cha").innerHTML = json.cha;

    // --- Populate immunities, skills, senses ---
    document.getElementById("mf-save").innerHTML = json.save || "—";
    document.getElementById("mf-skill").innerHTML = json.skill || "—";
    document.getElementById("mf-senses").innerHTML = json.senses || "—";
    document.getElementById("mf-immune").innerHTML = json.immune || "—";
    document.getElementById("mf-conditionImmune").innerHTML =
      json.conditionImmune || "—";
    document.getElementById("mf-languages").innerHTML = json.languages || "—";

    // --- Populate Traits ---
    const traitsContainer = document.getElementById("mf-traits");
    traitsContainer.innerHTML = ""; // clear placeholder

    json.traits.forEach((trait) => {
      const div = document.createElement("div");
      div.className = "mf-trait";
      div.innerHTML = `<strong>${trait.name}</strong> ${trait.entries}`;
      traitsContainer.appendChild(div);
    });

    // --- Populate Actions ---
    const actionsContainer = document.getElementById("mf-actions");
    actionsContainer.innerHTML = ""; // clear placeholder

    json.actions.forEach((action) => {
      const div = document.createElement("div");
      div.className = "mf-action";
      div.innerHTML = `<strong>${action.name}.</strong> ${action.entries}`;
      actionsContainer.appendChild(div);
    });

    // Render markdown
    document.getElementById("markdownContainer").innerHTML = marked.parse(md);

    // Future: statblock
    // renderStatblock(json);
  } catch (err) {
    console.error(err);
    document.querySelector(".content-wrapper").innerHTML =
      "<p>Error loading creature data.</p>";
  }
}

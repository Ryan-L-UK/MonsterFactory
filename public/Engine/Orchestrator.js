// ---------------------------------------------------------
// MonsterFactory Orchestrator
// Ensures all systems initialize in the correct order
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Orchestrator: Preparing systems...");

  // -----------------------------------------------------
  // 1. Load Navigation (Menu + Footer)
  // -----------------------------------------------------
  if (typeof initNavigation === "function") {
    console.log("Orchestrator: Loading navigation...");
    await initNavigation();
  }

  // -----------------------------------------------------
  // 2. Attach Menu Interactions
  // (must run AFTER navigation loads)
  // -----------------------------------------------------
  if (typeof initMenu === "function") {
    console.log("Orchestrator: Binding menu interactions...");
    initMenu();
  }

  // -----------------------------------------------------
  // 3. Content Viewer (Curated Creature Pages Only)
  // -----------------------------------------------------
  if (typeof initContentViewer === "function") {
    console.log("Orchestrator: Loading curated creature...");
    await initContentViewer();
  }

  // -----------------------------------------------------
  // 4. MonsterFactory Engine (Randomizer Page Only)
  // -----------------------------------------------------
  if (typeof initMonsterFactory === "function") {
    console.log("Orchestrator: Initializing MonsterFactory engine...");
    await initMonsterFactory();
  }

  // -----------------------------------------------------
  // 5. Exporter (Content Pages Only)
  // Must run AFTER content viewer has finished
  // -----------------------------------------------------
  if (typeof initExporter === "function") {
    console.log("Orchestrator: Preparing exporter...");
    await initExporter();
  }

  console.log("Orchestrator: All systems ready.");
});

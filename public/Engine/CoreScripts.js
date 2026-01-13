//-----------------------------------------
// INITIALIZE NAVIGATION (Menu + Footer)
//-----------------------------------------
async function initNavigation() {
  console.log("Wizard: Summoning menu...");

  try {
    // Load Menu
    const menuHTML = await fetch("/UI/Components/Menu.html").then((r) =>
      r.text()
    );
    const menuDoc = new DOMParser().parseFromString(menuHTML, "text/html");
    document.getElementById("Nav_output").innerHTML =
      menuDoc.querySelector("html").innerHTML;
    console.log("Wizard: Menu Appeared.");
  } catch (err) {
    console.log("Wizard: Menu Summoning Failed...", err);
  }

  try {
    // Load Footer
    console.log("Wizard: Summoning footer...");
    const footerHTML = await fetch("/UI/Components/Footer.html").then((r) =>
      r.text()
    );
    const footerDoc = new DOMParser().parseFromString(footerHTML, "text/html");
    document.getElementById("Ftr_output").innerHTML =
      footerDoc.querySelector("html").innerHTML;
    console.log("Wizard: Footer Appeared.");
  } catch (err) {
    console.log("Wizard: Footer Summoning Failed...", err);
  }
}

//-----------------------------------------
// INITIALIZE MENU INTERACTIONS
//-----------------------------------------
function initMenu() {
  console.log("Wizard: Binding menu interactions...");

  const menuHamburger = document.getElementById("menuHamburger");
  const menuNav = document.getElementById("menuItemContainer");
  const curatedToggle = document.getElementById("curatedDropdownToggle");
  const curatedPanel = document.getElementById("curatedDropdownPanel");

  // Hamburger toggle (mobile)
  if (menuHamburger && menuNav) {
    menuHamburger.addEventListener("click", () => {
      const isOpen = menuNav.classList.toggle("open");
      menuHamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // Curated dropdown toggle (mobile)
  if (curatedToggle && curatedPanel) {
    curatedToggle.addEventListener("click", () => {
      const isOpen = curatedPanel.classList.toggle("open");
      curatedToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // Reroll buttons
  const rerollDesktop = document.getElementById("menuRerollDesktop");
  const rerollMobile = document.getElementById("menuRefreshMobile");

  const triggerReroll = () => {
    if (typeof generateCreature === "function") {
      generateCreature();
    }
  };

  if (rerollDesktop) rerollDesktop.addEventListener("click", triggerReroll);
  if (rerollMobile) rerollMobile.addEventListener("click", triggerReroll);
}

//-----------------------------------------
// EXPORT FUNCTION (unchanged)
//-----------------------------------------
function exportCreature() {
  console.log("Artificier: Taking Notes...");

  const source = document.getElementById("main-creature");
  const target = document.getElementById("export-image");

  if (!source || !target) {
    console.warn("Artificier: Main creature or export container missing.");
    return;
  }

  const popup = window.open(
    "/export.html",
    "monsterfactory_export_preview",
    "width=900,height=900,resizable=yes,scrollbars=yes"
  );

  if (!popup) {
    alert(
      "Your browser blocked the export preview popup. Please allow popups for MonsterFactory to use export."
    );
    return;
  }

  const branding = target.querySelector(".export-footer");
  target.innerHTML = "";
  if (branding) target.appendChild(branding);

  const clone = source.cloneNode(true);
  if (branding) target.insertBefore(clone, branding);
  else target.appendChild(clone);

  const originalStyle = target.getAttribute("style") || "";
  target.style.width = "750px";
  target.style.maxWidth = "750px";

  html2canvas(target, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    scale: 2,
  })
    .then((canvas) => {
      target.setAttribute("style", originalStyle);

      const dataUrl = canvas.toDataURL("image/png");
      const name =
        document.getElementById("name-out")?.innerText?.trim() || "Creature";

      const sendExport = () => {
        popup.postMessage(
          {
            type: "mf-export-image",
            dataUrl: dataUrl,
            filename: name,
          },
          "*"
        );
      };

      if (popup.document.readyState === "complete") sendExport();
      else popup.onload = sendExport;
    })
    .catch((err) => {
      console.error("Artificier: Export failed.", err);
      if (!popup.closed) {
        popup.document.body.innerHTML =
          "<p style='padding:16px;font-family:system-ui;color:#f5f1e5;'>Something went wrong while rendering the export.</p>";
      }
    });

  console.log("Artificier: Notes Taken.");
}

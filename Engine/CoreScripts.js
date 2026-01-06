//-----------------------------------------
//Menu Load
console.log("Wizard: Summoning menu...");
fetch("/UI/Components/Menu.html")
  .then((Mresponse) => Mresponse.text())
  .then((MenuHTML) => {
    var parser = new DOMParser();
    var MenuDoc = parser.parseFromString(MenuHTML, "text/html");
    var MenuArticle = MenuDoc.querySelector("html").innerHTML;
    document.getElementById("Nav_output").innerHTML = MenuArticle;
    console.log("Wizard: Menu Appeared.");
    const hamburger = document.getElementById("menuHamburger");
    const menu = document.getElementById("menuItemContainer");
    if (hamburger && menu) {
      hamburger.addEventListener("click", () => {
        menu.classList.toggle("open");
        console.log("Button Click");
      });
    } else {
      console.log("Wizard: Menu elements not found.");
    }
  })
  .catch((err) => {
    console.log("Wizard: Casting Failure... ", err);
  });
//-----------------------------------------
//Footer Load
fetch("/UI/Components/Footer.html")
  .then(function (Fresponse) {
    console.log("Wizard: Summoning footer...");
    return Fresponse.text();
  })
  .then(function (FooterHTML) {
    var parser = new DOMParser();
    var FooterDoc = parser.parseFromString(FooterHTML, "text/html");
    var FooterArticle = FooterDoc.querySelector("html").innerHTML;
    document.getElementById("Ftr_output").innerHTML = FooterArticle;
    console.log("Wizard: Footer Appeared.");
  })
  .catch(function (err) {
    console.log("Wizard: Casting Failure... ", err);
  });

//-----------------------------------------
// Mobile + Desktop Menu
//-----------------------------------------
//Mobile Menu

document.addEventListener("DOMContentLoaded", () => {
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

  // Curated dropdown toggle (mobile only; desktop uses hover)
  if (curatedToggle && curatedPanel) {
    curatedToggle.addEventListener("click", () => {
      const isOpen = curatedPanel.classList.toggle("open");
      curatedToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // Hook up reroll buttons (desktop + mobile) to your existing logic
  const rerollDesktop = document.getElementById("menuRerollDesktop");
  const rerollMobile = document.getElementById("menuRefreshMobile");

  const triggerReroll = () => {
    // Call your existing reroll function here:
    // e.g., generateCreature(), or whatever you're using.
    if (typeof generateCreature === "function") {
      generateCreature();
    }
  };

  if (rerollDesktop) {
    rerollDesktop.addEventListener("click", triggerReroll);
  }
  if (rerollMobile) {
    rerollMobile.addEventListener("click", triggerReroll);
  }
});

//-----------------------------------------
//HTML2Canvas
function exportCreature() {
  console.log("Artificier: Taking Notes...");

  const source = document.getElementById("main-creature");
  const target = document.getElementById("export-image");

  if (!source || !target) {
    console.warn("Artificier: Main creature or export container missing.");
    return;
  }

  // 1. OPEN POPUP IMMEDIATELY (user-gesture safe)
  const popup = window.open("/export.html", "monsterfactory_export_preview");

  if (!popup) {
    alert(
      "Your browser blocked the export preview popup. Please allow popups for MonsterFactory to use export."
    );
    return;
  }

  // 2. PREP EXPORT DOM IN HIDDEN CONTAINER
  const branding = target.querySelector(".export-footer");
  if (!branding) {
    console.warn("Artificier: No export footer found inside #export-image.");
  }

  target.innerHTML = "";
  if (branding) target.appendChild(branding);

  const clone = source.cloneNode(true);
  if (branding) {
    target.insertBefore(clone, branding);
  } else {
    target.appendChild(clone);
  }

  const originalStyle = target.getAttribute("style") || "";
  target.style.width = "750px";
  target.style.maxWidth = "750px";

  // 3. RENDER WITH HTML2CANVAS
  html2canvas(target, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    scale: 2,
  })
    .then((canvas) => {
      // Restore original styling
      target.setAttribute("style", originalStyle);

      // Create PNG data URL
      const dataUrl = canvas.toDataURL("image/png");

      // Creature name for filename
      const name =
        document.getElementById("name-out")?.innerText?.trim() || "Creature";

      // 4. SEND PNG TO EXPORT PAGE
      popup.postMessage(
        {
          type: "mf-export-image",
          dataUrl: dataUrl,
          filename: name,
        },
        "*"
      );
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

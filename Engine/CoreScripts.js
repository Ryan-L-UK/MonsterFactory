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
  const popup = window.open(
    "",
    "monsterfactory_export_preview",
    "width=900,height=900,resizable=yes,scrollbars=yes"
  );

  if (!popup) {
    alert(
      "Your browser blocked the export preview popup. Please allow popups for MonsterFactory to use export."
    );
    return;
  }

  // Basic loading shell in the popup
  popup.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MonsterFactory Export</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            background: #05070b;
            color: #f5f1e5;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .export-shell {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
            box-sizing: border-box;
          }
          .export-header {
            width: 100%;
            max-width: 820px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            gap: 8px;
          }
          .export-title {
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            opacity: 0.9;
          }
          .export-actions {
            display: flex;
            gap: 8px;
          }
          .export-btn {
            border: 1px solid #d6ae4a;
            background: #12151d;
            color: #f5f1e5;
            padding: 6px 12px;
            font-size: 0.8rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 4px;
          }
          .export-btn:hover {
            background: #1b2230;
          }
          .export-status {
            width: 100%;
            max-width: 820px;
            font-size: 0.85rem;
            margin-bottom: 8px;
            opacity: 0.85;
          }
          .export-image-wrapper {
            width: 100%;
            max-width: 820px;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid rgba(255,255,255,0.12);
            background: radial-gradient(circle at top, #131824 0%, #05070b 65%);
            padding: 12px;
            box-sizing: border-box;
          }
          .export-image-wrapper img {
            max-width: 100%;
            height: auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="export-shell">
          <div class="export-header">
            <div class="export-title">MonsterFactory Export Preview</div>
            <div class="export-actions">
              <button class="export-btn" id="mfExportSaveBtn">Save Image</button>
              <button class="export-btn" id="mfExportCloseBtn">Close</button>
            </div>
          </div>
          <div class="export-status" id="mfExportStatus">
            Rendering your creature card&hellip;
          </div>
          <div class="export-image-wrapper">
            <div id="mfExportImagePlaceholder">Preparing image&hellip;</div>
          </div>
        </div>
      </body>
    </html>
  `);
  popup.document.close();

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

      // 4. INJECT INTO POPUP
      const doc = popup.document;
      const placeholder = doc.getElementById("mfExportImagePlaceholder");
      const statusEl = doc.getElementById("mfExportStatus");
      const saveBtn = doc.getElementById("mfExportSaveBtn");
      const closeBtn = doc.getElementById("mfExportCloseBtn");

      if (!placeholder || !statusEl || !saveBtn || !closeBtn) {
        console.warn("Artificier: Popup shell missing expected elements.");
        return;
      }

      // Replace placeholder with image
      const img = doc.createElement("img");
      img.src = dataUrl;
      img.alt = "Exported creature card";
      placeholder.replaceWith(img);

      // Status update
      const name =
        document.getElementById("name-out")?.innerText?.trim() || "Creature";
      statusEl.textContent = `Previewing: ${name}.png`;

      // Hook up Save button: this triggers the iOS big download prompt
      saveBtn.addEventListener("click", () => {
        const a = doc.createElement("a");
        a.href = dataUrl;
        a.download = `${name}.png`;
        doc.body.appendChild(a);
        a.click();
        doc.body.removeChild(a);
      });

      // Close button
      closeBtn.addEventListener("click", () => {
        popup.close();
      });
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

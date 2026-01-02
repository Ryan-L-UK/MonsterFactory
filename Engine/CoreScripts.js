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
//HTML2Canvas

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

  const branding = target.querySelector(".export-footer");
  target.innerHTML = "";
  target.appendChild(branding);

  const clone = source.cloneNode(true);
  target.insertBefore(clone, branding);

  const originalStyle = target.getAttribute("style") || "";
  target.style.width = "750px";
  target.style.maxWidth = "750px";

  html2canvas(target, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    scale: 3,
  }).then((canvas) => {
    target.setAttribute("style", originalStyle);

    // Convert to Blob (safe for new tab)
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank"; // open in new tab safely
      a.click();

      URL.revokeObjectURL(url);
    }, "image/png");
  });

  console.log("Artificier: Notes Taken.");
}

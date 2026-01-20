function initMenu() {
  const menuHamburger = document.getElementById("menuHamburger");
  const menuNav = document.getElementById("menuItemContainer");
  // Hamburger toggle (mobile)
  if (menuHamburger && menuNav) {
    menuHamburger.addEventListener("click", () => {
      const isOpen = menuNav.classList.toggle("mn-open");
      menuHamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }
  // (Optional) Curated dropdown — only runs if elements exist
  const curatedToggle = document.getElementById("curatedDropdownToggle");
  const curatedPanel = document.getElementById("curatedDropdownPanel");
  if (curatedToggle && curatedPanel) {
    curatedToggle.addEventListener("click", () => {
      const isOpen = curatedPanel.classList.toggle("open");
      curatedToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }
  // (Optional) Reroll buttons — only runs if elements exist
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
document.addEventListener("DOMContentLoaded", initMenu);

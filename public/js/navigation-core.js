//-----------------------------------------
// INITIALIZE NAVIGATION (Menu + Footer)
//-----------------------------------------
async function initNavigation() {
  try {
    // Load Menu
    const menuHTML = await fetch("/components/menu.html").then((r) => r.text());
    const menuDoc = new DOMParser().parseFromString(menuHTML, "text/html");
    document.getElementById("Nav_output").innerHTML =
      menuDoc.querySelector("html").innerHTML;
  } catch (err) {
    console.earn("Wizard: Menu Summoning Failed...", err);
  }
  try {
    // Load Footer
    const footerHTML = await fetch("/components/footer.html").then((r) =>
      r.text(),
    );
    const footerDoc = new DOMParser().parseFromString(footerHTML, "text/html");
    document.getElementById("Ftr_output").innerHTML =
      footerDoc.querySelector("html").innerHTML;
  } catch (err) {
    console.warn("Wizard: Footer Summoning Failed...", err);
  }
}

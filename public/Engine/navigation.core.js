//-----------------------------------------
// INITIALIZE NAVIGATION (Menu + Footer)
//-----------------------------------------
async function initNavigation() {
  console.log("Wizard: Summoning menu...");

  try {
    // Load Menu
    const menuHTML = await fetch("/UI/Menu.html").then((r) => r.text());
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
    const footerHTML = await fetch("/UI/Footer.html").then((r) => r.text());
    const footerDoc = new DOMParser().parseFromString(footerHTML, "text/html");
    document.getElementById("Ftr_output").innerHTML =
      footerDoc.querySelector("html").innerHTML;
    console.log("Wizard: Footer Appeared.");
  } catch (err) {
    console.log("Wizard: Footer Summoning Failed...", err);
  }
}

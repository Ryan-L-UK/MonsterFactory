//-----------------------------------------
//Menu Load
console.log("Wizard: Summoning menu...");
fetch("/Codex/Menu.html")
  .then((Mresponse) => Mresponse.text())
  .then((MenuHTML) => {
    var parser = new DOMParser();
    var MenuDoc = parser.parseFromString(MenuHTML, "text/html");
    var MenuArticle = MenuDoc.querySelector("html").innerHTML;
    document.getElementById("Nav_output").innerHTML = MenuArticle;
    console.log("Wizard: Menu Appeared.");
    //-----------------------------------------
    // Now the menu exists — attach listeners here
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
    //-----------------------------------------
  })
  .catch((err) => {
    console.log("Wizard: Casting Failure... ", err);
  });
//-----------------------------------------
//Footer Load
fetch("/Codex/Footer.html")
  .then(function (Fresponse) {
    console.log("Wizard: Summoning footer...");
    // When the page is loaded convert it to text
    return Fresponse.text();
  })
  .then(function (FooterHTML) {
    // Initialize the DOM parser
    var parser = new DOMParser();
    // Parse the text
    var FooterDoc = parser.parseFromString(FooterHTML, "text/html");
    // You can now even select part of that html as you would in the regular DOM
    // Example:
    var FooterArticle = FooterDoc.querySelector("html").innerHTML;
    document.getElementById("Ftr_output").innerHTML = FooterArticle;
    console.log("Wizard: Footer Appeared.");
  })
  .catch(function (err) {
    console.log("Wizard: Casting Failure... ", err);
  });
//-----------------------------------------
//HTML2Canvas Columns
function takeshot() {
  console.log("Artificier: Taking Notes...");
  document.getElementById("output").innerHTML = "";
  let div = document.getElementById("photo");
  html2canvas(div).then(function (canvas) {
    document.getElementById("output").appendChild(canvas);
    var a = document.createElement("a");
    // toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
    a.href = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    a.download = document.getElementById("name").value + ".png";
    a.click();
  });
  console.log("Artificier: Notes Taken.");
}

//-----------------------------------------
// EXPORT FUNCTION (updated for EJS)
//-----------------------------------------
function exportCreature() {
  console.log("Factory: Taking Notes...");

  const source = document.getElementById("main-creature");
  const target = document.getElementById("export-image");

  if (!source || !target) {
    console.warn("Factory: Main creature or export container missing.");
    return;
  }

  // Open the new EJS route instead of export.html
  const popup = window.open(
    "/export",
    "monsterfactory_export_preview",
    "width=900,height=900,resizable=yes,scrollbars=yes"
  );

  if (!popup) {
    alert(
      "Your browser blocked the export preview popup. Please allow popups for MonsterFactory to use export."
    );
    return;
  }

  // Prepare export container
  const branding = target.querySelector(".export-footer");
  target.innerHTML = "";
  if (branding) target.appendChild(branding);

  const clone = source.cloneNode(true);
  if (branding) target.insertBefore(clone, branding);
  else target.appendChild(clone);

  const originalStyle = target.getAttribute("style") || "";
  target.style.width = "750px";
  target.style.maxWidth = "750px";

  // Render creature
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

      // More reliable than popup.onload
      const sendWhenReady = setInterval(() => {
        if (
          popup &&
          popup.document &&
          popup.document.readyState === "complete"
        ) {
          clearInterval(sendWhenReady);
          popup.postMessage(
            {
              type: "mf-export-image",
              dataUrl,
              filename: name,
            },
            "*"
          );
        }
      }, 50);
    })
    .catch((err) => {
      console.error("Factory: Export failed.", err);
      if (!popup.closed) {
        popup.document.body.innerHTML =
          "<p style='padding:16px;font-family:system-ui;color:#f5f1e5;'>Something went wrong while rendering the export.</p>";
      }
    });

  console.log("Factory: Notes Taken.");
}

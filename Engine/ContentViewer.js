//-----------------------------------------
// URL Params
//-----------------------------------------
const params = new URLSearchParams(window.location.search);
const slug = params.get("curated");

if (!slug) {
  console.error("No curated creature provided.");
}

// Paths
const jsonPath = `/Data/curated/${slug}.json`;
const mdPath = `/Data/curated/${slug}.md`;

//-----------------------------------------
// Load JSON (statblock)
//-----------------------------------------
fetch(jsonPath)
  .then((res) => res.json())
  .then((data) => {
    renderStatblock(data);
  })
  .catch((err) => console.error("Error loading JSON:", err));

//-----------------------------------------
// Markdown Renderer (markdown-it)
//-----------------------------------------
const md = window.markdownit({
  html: true,
  linkify: true,
  typographer: true,
});

//-----------------------------------------
// Load Markdown (lore)
//-----------------------------------------
fetch(mdPath)
  .then((res) => res.text())
  .then((markdown) => {
    const html = md.render(markdown);
    document.getElementById("lore").innerHTML = html;
  })
  .catch((err) => console.error("Error loading markdown:", err));

//-----------------------------------------
// Render Statblock
//-----------------------------------------
function renderStatblock(monster) {
  document.getElementById("statblock").innerHTML = "Statblock";
}

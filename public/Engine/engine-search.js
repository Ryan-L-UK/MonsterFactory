//Gallery Search
document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("gallerySearch");
  const cards = document.querySelectorAll(".curated-card");

  search.addEventListener("input", () => {
    const q = search.value.toLowerCase();

    cards.forEach((card) => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    });
  });
});

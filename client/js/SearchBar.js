import { KKPHIM_API } from "../config.js";
const IMG_CDN = "https://phimimg.com";

export function searchBar() {
  const input = document.querySelector(".search__input");
  const dropdown = document.querySelector(".search__dropdown");
  let timer;

  async function fetchResults(query) {
    const res = await fetch(`${KKPHIM_API}/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}`);
    const data = await res.json();
    return (data?.data?.items || []).map(item => ({
      ...item,
      media_type: (item.category || []).some(c => c.slug === "phim-bo" || c.slug === "tv-shows") ? "tv" : "movie"
    }));
  }

  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(timer);
    if (!query) {
      dropdown.innerHTML = "";
      dropdown.classList.remove("search__dropdown--active");
      return;
    }
    timer = setTimeout(async () => {
      try {
        const results = await fetchResults(query);
        renderResults(results.slice(0, 10));
      } catch (e) {
        console.error(e);
      }
    }, 400);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = input.value.trim();
      if (query)
        window.location.href = `SearchPage.html?query=${encodeURIComponent(query)}`;
    }
  });

  function renderResults(results) {
    dropdown.innerHTML = "";
    if (!results.length) return dropdown.classList.remove("search__dropdown--active");
    dropdown.classList.add("search__dropdown--active");

    results.forEach((item) => {
      if (!item.poster_url) return;
      const card = document.createElement("div");
      card.classList.add("search__result");

      const img = item.poster_url.startsWith("http") ? item.poster_url : `${IMG_CDN}/${item.poster_url}`;
      const title = item.name || "Không rõ";
      const original = item.origin_name || "";
      const year = item.year || "";
      const type = item.media_type === "movie" ? `Phim lẻ • ${year}` : `Phim bộ • ${year}`;

      card.innerHTML = `
        <img class="search__result-img" src="${img}" alt="${title}">
        <div class="search__result-info">
          <div class="search__result-title">${title}</div>
          ${original && original !== title ? `<div class="search__result-subtitle">${original}</div>` : ""}
          <div class="search__result-meta">${type}</div>
        </div>
      `;

      card.addEventListener("click", () => {
        dropdown.classList.remove("search__dropdown--active");
        window.location.href = `DetailPage.html?slug=${item.slug}`;
      });

      dropdown.appendChild(card);
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search"))
      dropdown.classList.remove("search__dropdown--active");
  });
}

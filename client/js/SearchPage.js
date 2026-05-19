import { KKPHIM_API } from "../config.js";
import { cachedFetch, cachedHTML } from "../js/cache-utils.js";
import { observeLazyImages } from "../js/lazy-utils.js";
const IMG_CDN = "https://phimimg.com";

const params = new URLSearchParams(window.location.search);
const query = params.get("query") || "";
document.getElementById("query-text").textContent = query;

const grid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const filterButtons = document.querySelectorAll(".searchPage__filterBtn");

let currentFilter = "all";
let allResults = [];
let currentPage = 1;
let totalPages = 1;

let movieCardTemplate = "";
let tvCardTemplate = "";

let translations = {};

async function loadTranslations(lang) {
  try {
    const res = await fetch(`../../public/locales/${lang}.json`);
    translations = await res.json();
  } catch (err) {
    console.error("Load translations error:", err);
  }
}

function t(key) {
  return translations[key] || key;
}

function currentLang() {
  return localStorage.getItem("language") || document.documentElement.lang || "vi";
}

function translateDOM() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}

function getMediaType(item) {
  if (item.type === "series") return "tv";
  if (item.type === "single") return "movie";
  const cats = (item.category || []).map(c => c.slug);
  if (cats.includes("phim-bo") || cats.includes("tv-shows")) return "tv";
  return "movie";
}

function getMediaTypeLabel(type) {
  const lang = localStorage.getItem("language") || document.documentElement.lang || "vi";
  if (type === "movie") return lang === "vi" ? "Phim lẻ" : "Movies";
  if (type === "tv") return lang === "vi" ? "Phim bộ" : "Series";
  return "";
}

Promise.all([
  cachedHTML("../components/MovieCardRender.html"),
  cachedHTML("../components/TvShowCardRender.html"),
])
  .then(([movieHTML, tvHTML]) => {
    movieCardTemplate = movieHTML.trim();
    tvCardTemplate = tvHTML.trim();
    boot();
  })
  .catch((err) => console.error("Không tải được component:", err));

async function loadResults(type = "all") {
  grid.innerHTML = `<p class="searchPage__placeholder">${t("search.loading") || "Đang tải..."}</p>`;

  try {
    const data = await cachedFetch(`${KKPHIM_API}/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&page=${currentPage}`, 2 * 60 * 1000);
    const items = data?.data?.items || data.items || [];

    let filtered = items;
    if (type === "movie") {
      filtered = items.filter(item => getMediaType(item) === "movie");
    } else if (type === "tv") {
      filtered = items.filter(item => getMediaType(item) === "tv");
    }

    allResults = filtered.slice(0, 18);
    totalPages = data?.data?.paginate?.total_page || data?.paginate?.total_page || 1;

    renderResults();
    renderPagination();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="searchPage__placeholder">${t("search.error") || "Lỗi tải dữ liệu."}</p>`;
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("searchPage__filterBtn--active"));
    btn.classList.add("searchPage__filterBtn--active");
    currentFilter = btn.dataset.type;
    currentPage = 1;
    loadResults(currentFilter);
  });
});

function renderResults() {
  grid.innerHTML = "";

  if (!allResults.length) {
    grid.innerHTML = `<p class="searchPage__placeholder">${t("search.noResults") || "Không tìm thấy kết quả."}</p>`;
    return;
  }

  allResults.forEach((item) => {
    const type = getMediaType(item);
    const isMovie = type === "movie";
    const template = isMovie ? movieCardTemplate : tvCardTemplate;
    const poster = item.poster_url
      ? (item.poster_url.startsWith("http") ? item.poster_url : `${IMG_CDN}/${item.poster_url}`)
      : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
    const title = item.name || "Không rõ";
    const original = item.origin_name || "";

    const html = template
      .replace(/{{id}}/g, item.slug)
      .replace(/{{poster}}/g, poster)
      .replace(/{{title}}/g, title)
      .replace(/{{original_title}}/g, original)
      .replace(/{{name}}/g, title)
      .replace(/{{media_type_label}}/g, getMediaTypeLabel(type));

    grid.insertAdjacentHTML("beforeend", html);
  });
  observeLazyImages();
}

function renderPagination() {
  const old = document.querySelector(".content__pagination");
  if (old) old.remove();
  if (totalPages <= 1) return;

  const wrapper = document.createElement("div");
  wrapper.className = "content__pagination";

  const prev = document.createElement("button");
  prev.className = "pagination-left-arrow";
  prev.innerHTML = "&#8592;";
  if (currentPage <= 1) prev.classList.add("disable");
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadResults(currentFilter);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const info = document.createElement("div");
  info.className = "pagination__main";

  const currentSpan = document.createElement("span");
  currentSpan.className = "pagination-page-current";
  currentSpan.textContent = currentPage;

  const separator = document.createElement("span");
  separator.textContent = "/";

  const totalSpan = document.createElement("span");
  totalSpan.textContent = totalPages;

  info.append(currentSpan, separator, totalSpan);

  const next = document.createElement("button");
  next.className = "pagination-right-arrow";
  next.innerHTML = "&#8594;";
  if (currentPage >= totalPages) next.classList.add("disable");
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadResults(currentFilter);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  wrapper.append(prev, info, next);
  pagination.after(wrapper);
}

async function boot() {
  await loadTranslations(currentLang());
  translateDOM();
  loadResults(currentFilter);
}

window.addEventListener("languagechange", async () => {
  await boot();
});

window.addEventListener("storage", (e) => {
  if (e.key === "language") {
    location.reload();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (movieCardTemplate) boot();
});

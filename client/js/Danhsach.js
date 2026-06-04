import { KKPHIM_API, imageUrl } from "../config.js";
import { cachedFetch, cachedHTML } from "../js/cache-utils.js";
import { observeLazyImages } from "../js/lazy-utils.js";

let currentPage = 1;
let currentType = "all";
let currentSort = "modified.time";
let currentSortDir = "desc";
let currentGenre = "all";
let totalPages = 100;

let movieCardTemplate = "";
let tvShowCardTemplate = "";

const DOM = {
  movieContainer: document.querySelector(".movie"),
  pageCurrent: document.querySelector(".pagination-page-current"),
  pageTotal: document.querySelector(".pagination__main span:last-child"),
  leftPag: document.querySelector(".pagination-left-arrow"),
  rightPag: document.querySelector(".pagination-right-arrow"),
  filterToggle: document.querySelector(".filter__toggle"),
  filterSelect: document.querySelector(".filter__select"),
  faFilter: document.querySelector(".fa-solid.fa-filter"),
  filterCloseBtn: document.querySelector(".filter__close-btn"),
  filterBtn: document.querySelector(".filter__select-btn"),
  typeItems: document.querySelectorAll(".filter__select-list.movie-type .filter__select-list-item"),
  arrangeItems: document.querySelectorAll(".filter__select-list.arrange .filter__select-list-item"),
  genreItems: document.querySelectorAll(".filter__select-list.movie-genre .filter__select-list-item"),
  countryItems: document.querySelectorAll(".filter__select-list.country .filter__select-list-item"),
};

const GENRE_SLUG_MAP = {
  "hanh-dong": "hanh-dong",
  "tinh-cam": "tinh-cam",
  "hai-huoc": "hai-huoc",
  "co-trang": "co-trang",
  "tam-ly": "tam-ly",
  "hinh-su": "hinh-su",
  "chien-tranh": "chien-tranh",
  "the-thao": "the-thao",
  "vo-thuat": "vo-thuat",
  "vien-tuong": "vien-tuong",
  "phieu-luu": "phieu-luu",
  "khoa-hoc": "khoa-hoc",
  "kinh-di": "kinh-di",
  "am-nhac": "am-nhac",
  "than-thoai": "than-thoai",
  "tai-lieu": "tai-lieu",
  "gia-dinh": "gia-dinh",
  "chinh-kich": "chinh-kich",
  "bi-an": "bi-an",
  "hoc-duong": "hoc-duong",
  "kinh-dien": "kinh-dien",
  "hoat-hinh": "hoat-hinh",
  "phim-18": "phim-18",
  "short-drama": "short-drama",
};

const COUNTRY_SLUG_MAP = {
  "trung-quoc": "trung-quoc",
  "han-quoc": "han-quoc",
  "nhat-ban": "nhat-ban",
  "thai-lan": "thai-lan",
  "au-my": "au-my",
  "dai-loan": "dai-loan",
  "hong-kong": "hong-kong",
  "an-do": "an-do",
  "anh": "anh",
  "phap": "phap",
  "canada": "canada",
  "duc": "duc",
  "tay-ban-nha": "tay-ban-nha",
  "tho-nhi-ky": "tho-nhi-ky",
  "ha-lan": "ha-lan",
  "indonesia": "indonesia",
  "nga": "nga",
  "mexico": "mexico",
  "ba-lan": "ba-lan",
  "uc": "uc",
  "thuy-dien": "thuy-dien",
  "malaysia": "malaysia",
  "brazil": "brazil",
  "philippines": "philippines",
  "bo-dao-nha": "bo-dao-nha",
  "y": "y",
  "dan-mach": "dan-mach",
  "thuy-si": "thuy-si",
  "viet-nam": "viet-nam",
  "chile": "chile",
  "hy-lap": "hy-lap",
  "nigeria": "nigeria",
  "argentina": "argentina",
  "singapore": "singapore",
  "uae": "uae",
  "na-uy": "na-uy",
  "ireland": "ireland",
  "colombia": "colombia",
  "phan-lan": "phan-lan",
  "chau-phi": "chau-phi",
  "nam-phi": "nam-phi",
  "ukraina": "ukraina",
  "a-rap-xe-ut": "a-rap-xe-ut",
};

const PRIORITY_COUNTRIES = ["au-my", "nhat-ban", "han-quoc", "trung-quoc", "anh", "phap", "thai-lan", "dai-loan", "hong-kong", "an-do", "viet-nam"];

DOM.filterToggle?.addEventListener("click", () => {
  DOM.filterSelect?.classList.toggle("hidden");
  DOM.faFilter?.classList.toggle("fa-filter-active");
});

DOM.filterCloseBtn?.addEventListener("click", () => {
  DOM.filterSelect?.classList.add("hidden");
  DOM.faFilter?.classList.remove("fa-filter-active");
});

DOM.typeItems?.forEach((item) => {
  item.addEventListener("click", () => {
    DOM.typeItems.forEach((b) => b.classList.remove("filter__select--active"));
    item.classList.add("filter__select--active");
  });
});

DOM.arrangeItems?.forEach((item) => {
  item.addEventListener("click", () => {
    DOM.arrangeItems.forEach((b) => b.classList.remove("filter__select--active"));
    item.classList.add("filter__select--active");
  });
});

DOM.genreItems?.forEach((item) => {
  item.addEventListener("click", () => {
    DOM.genreItems.forEach((b) => b.classList.remove("filter__select--active"));
    item.classList.add("filter__select--active");
  });
});

DOM.countryItems?.forEach((item) => {
  item.addEventListener("click", () => {
    DOM.countryItems.forEach((b) => b.classList.remove("filter__select--active"));
    item.classList.add("filter__select--active");
  });
});

function getTypeSlug(type) {
  const map = { all: "all", movie: "phim-chieu-rap", tv: "phim-bo", "tv-shows": "tv-shows" };
  return map[type] || "all";
}

function getMediaTypeLabel(type) {
  const lang = localStorage.getItem("language") || document.documentElement.lang || "vi";
  if (type === "movie") return lang === "vi" ? "Phim l\u1ebb" : "Movies";
  if (type === "tv") return lang === "vi" ? "Phim b\u1ed9" : "Series";
  if (type === "tvshows") return "TV Shows";
  return "";
}

function getSortParams(arrange) {
  switch (arrange) {
    case "new": return { field: "modified.time", dir: "desc" };
    case "popular": return { field: "view", dir: "desc" };
    case "imdb": return { field: "rating", dir: "desc" };
    case "imdb-asc": return { field: "rating", dir: "asc" };
    case "imdb-desc": return { field: "rating", dir: "desc" };
    case "view-asc": return { field: "view", dir: "asc" };
    case "view-desc": return { field: "view", dir: "desc" };
    default: return { field: "modified.time", dir: "desc" };
  }
}

const PRIORITY_SET = new Set(PRIORITY_COUNTRIES);

function sortByCountryPriority(items) {
  const priority = [];
  const other = [];
  for (const item of items) {
    const countries = item.country;
    let isPriority = false;
    if (countries) {
      for (let i = 0; i < countries.length; i++) {
        if (PRIORITY_SET.has(countries[i].slug)) {
          isPriority = true;
          break;
        }
      }
    }
    if (isPriority) priority.push(item);
    else other.push(item);
  }
  priority.sort((a, b) => (b.year || 0) - (a.year || 0));
  other.sort((a, b) => (b.year || 0) - (a.year || 0));
  return priority.concat(other);
}

function getMediaTypeFromItem(item) {
  if (item._media_type) return item._media_type;
  if (item.type === "single") return "movie";
  if (item.type === "tvshows") return "tvshows";
  return "tv";
}

async function initApp() {
  try {
    const [movieHtml, tvHtml] = await Promise.all([
      cachedHTML("../components/MovieCardRender.html"),
      cachedHTML("../components/TvShowCardRender.html"),
    ]);
    movieCardTemplate = movieHtml;
    tvShowCardTemplate = tvHtml;

    const params = new URLSearchParams(window.location.search);
    const urlType = params.get("type");
    const urlGenre = params.get("genre");
    const urlCountry = params.get("country");

    if (urlType) {
      DOM.typeItems?.forEach((item) => {
        if (item.getAttribute("data-type") === urlType) {
          DOM.typeItems.forEach((b) => b.classList.remove("filter__select--active"));
          item.classList.add("filter__select--active");
        }
      });
    }
    if (urlGenre) {
      DOM.genreItems?.forEach((item) => {
        if (item.getAttribute("data-genre") === urlGenre) {
          DOM.genreItems.forEach((b) => b.classList.remove("filter__select--active"));
          item.classList.add("filter__select--active");
        }
      });
    }
    if (urlCountry) {
      DOM.countryItems?.forEach((item) => {
        if (item.getAttribute("data-country") === urlCountry) {
          DOM.countryItems.forEach((b) => b.classList.remove("filter__select--active"));
          item.classList.add("filter__select--active");
        }
      });
    }

    await render();
  } catch (error) {
    console.log("Lỗi load template:", error);
  }
}

initApp();

async function render() {
  try {
    const activeType = document.querySelector(".filter__select-list.movie-type .filter__select--active");
    const type = activeType?.getAttribute("data-type") || "all";

    const activeArrange = document.querySelector(".filter__select-list.arrange .filter__select--active");
    const arrange = activeArrange?.getAttribute("data-arrange") || "new";
    const sort = getSortParams(arrange);

    const activeGenre = document.querySelector(".filter__select-list.movie-genre .filter__select--active");
    const genre = activeGenre?.getAttribute("data-genre") || "all";

    const activeCountry = document.querySelector(".filter__select-list.country .filter__select--active");
    const country = activeCountry?.getAttribute("data-country") || "all";

    let items = [];
    let maxPages = 1;
    const isGenreOrCountry = (country !== "all" && COUNTRY_SLUG_MAP[country]) || (genre !== "all" && GENRE_SLUG_MAP[genre]);

    function getTotalPages(resp) {
      const p1 = resp?.data?.paginate;
      if (p1?.total_page) return p1.total_page;
      if (p1?.total_items) return Math.ceil(p1.total_items / 18);
      const p2 = resp?.paginate;
      if (p2?.total_page) return p2.total_page;
      if (p2?.total_items) return Math.ceil(p2.total_items / 18);
      if (resp?.data?.totalPages) return resp.data.totalPages;
      if (resp?.data?.totalItems) return Math.ceil(resp.data.totalItems / 18);
      if (resp?.totalPages) return resp.totalPages;
      if (resp?.totalItems) return Math.ceil(resp.totalItems / 18);
      return null;
    }
    function estimateMaxPages(resp, limit) {
      const apiPages = getTotalPages(resp);
      if (apiPages !== null) return apiPages;
      const itms = resp?.data?.items || resp?.items || [];
      if (itms.length === 0) return currentPage;
      if (itms.length >= limit) return 10;
      return currentPage;
    }

    const FETCH_LIMIT = 18;

    if (country !== "all" && COUNTRY_SLUG_MAP[country]) {
      const countrySlug = COUNTRY_SLUG_MAP[country];
      const data = await cachedFetch(`${KKPHIM_API}/v1/api/quoc-gia/${countrySlug}?page=${currentPage}&limit=${FETCH_LIMIT}`, 5 * 60 * 1000);
      items = (data?.data?.items || []).map(i => ({ ...i, _media_type: getMediaTypeFromItem(i) }));
      maxPages = estimateMaxPages(data, FETCH_LIMIT);
    } else if (genre !== "all" && GENRE_SLUG_MAP[genre]) {
      const genreSlug = GENRE_SLUG_MAP[genre];
      const data = await cachedFetch(`${KKPHIM_API}/v1/api/the-loai/${genreSlug}?page=${currentPage}&limit=${FETCH_LIMIT}`, 5 * 60 * 1000);
      items = (data?.data?.items || []).map(i => ({ ...i, _media_type: getMediaTypeFromItem(i) }));
      maxPages = estimateMaxPages(data, FETCH_LIMIT);
    } else if (type === "all") {
      const [movieData, tvData, tvShowsData] = await Promise.all([
        cachedFetch(`${KKPHIM_API}/v1/api/danh-sach/phim-chieu-rap?page=${currentPage}&limit=10&sort_field=year&sort_type=desc`, 5 * 60 * 1000),
        cachedFetch(`${KKPHIM_API}/v1/api/danh-sach/phim-bo?page=${currentPage}&limit=10&sort_field=year&sort_type=desc`, 5 * 60 * 1000),
        cachedFetch(`${KKPHIM_API}/v1/api/danh-sach/tv-shows?page=${currentPage}&limit=10&sort_field=year&sort_type=desc`, 5 * 60 * 1000),
      ]);
      const movieItems = (movieData?.data?.items || []).slice(0, 10).map(i => ({ ...i, _media_type: "movie" }));
      const tvItems = (tvData?.data?.items || []).slice(0, 10).map(i => ({ ...i, _media_type: "tv" }));
      const tvShowsItems = (tvShowsData?.data?.items || []).slice(0, 10).map(i => ({ ...i, _media_type: "tvshows" }));
      const combined = [];
      for (let i = 0; i < 10; i++) {
        if (movieItems[i]) combined.push(movieItems[i]);
        if (tvItems[i]) combined.push(tvItems[i]);
        if (tvShowsItems[i]) combined.push(tvShowsItems[i]);
      }
      items = combined;
      maxPages = Math.max(
        estimateMaxPages(movieData, 10),
        estimateMaxPages(tvData, 10),
        estimateMaxPages(tvShowsData, 10)
      );
    } else {
      const slug = getTypeSlug(type);
      const data = await cachedFetch(`${KKPHIM_API}/v1/api/danh-sach/${slug}?page=${currentPage}&limit=${FETCH_LIMIT}&sort_field=year&sort_type=desc`, 5 * 60 * 1000);
      let rawItems = data?.data?.items || [];
      const mediaType = type === "movie" ? "movie" : type === "tv" ? "tv" : "tvshows";
      items = rawItems.map(i => ({ ...i, _media_type: mediaType }));
      items = sortByCountryPriority(items);
      maxPages = estimateMaxPages(data, FETCH_LIMIT);
    }

    if (isGenreOrCountry && arrange !== "new") {
      items.sort((a, b) => {
        let va, vb;
        if (sort.field === "rating") {
          va = parseFloat(a.tmdb?.vote_average ?? a.tmdb?.vote_average ?? 0);
          vb = parseFloat(b.tmdb?.vote_average ?? b.tmdb?.vote_average ?? 0);
        } else {
          va = parseInt(a[sort.field]) || 0;
          vb = parseInt(b[sort.field]) || 0;
        }
        return sort.dir === "asc" ? va - vb : vb - va;
      });
    }

    totalPages = Math.min(maxPages, 10);
    updatePageNumber();
    displayMovies(items);
  } catch (error) {
    console.log("Lỗi render:", error);
  }
}

function displayMovies(movieList) {
  const paginationEl = document.querySelector(".content__pagination");

  if (!movieList || movieList.length === 0) {
    DOM.movieContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #aaa;">
        <div style="font-size: 20px; margin-bottom: 8px;">Không có kết quả</div>
      </div>
    `;
    if (paginationEl) paginationEl.style.display = "none";
    return;
  }

  if (paginationEl) paginationEl.style.display = "flex";

  let html = "";

  for (const movie of movieList) {
    const mediaType = getMediaTypeFromItem(movie);
    const isMovie = mediaType === "movie";
    const template = isMovie ? movieCardTemplate : tvShowCardTemplate;
    const lang = localStorage.getItem("language") || document.documentElement.lang || "vi";
    const poster = movie.poster_url ? imageUrl(movie.poster_url) : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
    const title = lang === "en" ? (movie.origin_name || movie.name || "Không rõ") : (movie.name || movie.origin_name || "Không rõ");
    const original = lang === "en" ? (movie.origin_name || movie.name || "") : (movie.origin_name || "");

    let cardHtml = template
      .replace(/{{id}}/g, movie.slug || movie._id)
      .replace(/{{poster}}/g, poster)
      .replace(/{{title}}/g, title)
      .replace(/{{original_title}}/g, original)
      .replace(/{{name}}/g, title)
      .replace(/{{media_type_label}}/g, getMediaTypeLabel(mediaType));

    html += cardHtml;
  }

  DOM.movieContainer.innerHTML = html;
  observeLazyImages();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updatePageNumber() {
  if (DOM.pageCurrent) DOM.pageCurrent.textContent = currentPage;
  if (DOM.pageTotal) DOM.pageTotal.textContent = totalPages;
  updatePaginationButtons();
}

function updatePaginationButtons() {
  if (DOM.leftPag) DOM.leftPag.classList.toggle("disable", currentPage <= 1);
  if (DOM.rightPag) DOM.rightPag.classList.toggle("disable", currentPage >= totalPages);
}

DOM.filterBtn?.addEventListener("click", async () => {
  currentPage = 1;
  if (DOM.pageCurrent) DOM.pageCurrent.textContent = "1";
  DOM.filterSelect?.classList.add("hidden");
  DOM.faFilter?.classList.remove("fa-filter-active");
  await render();
});

DOM.rightPag?.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    currentPage++;
    if (DOM.pageCurrent) DOM.pageCurrent.textContent = currentPage;
    await render();
  }
});

DOM.leftPag?.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    if (DOM.pageCurrent) DOM.pageCurrent.textContent = currentPage;
    await render();
  }
});

window.addEventListener("languagechange", () => {
  currentPage = 1;
  render();
});

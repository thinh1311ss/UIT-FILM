import { KKPHIM_API, imageUrl } from "../config.js";
import { cachedFetch, cachedHTML } from "../js/cache-utils.js";
import { observeLazyImages } from "../js/lazy-utils.js";

let movieCardTemplate = "";
let tvCardTemplate = "";

Promise.all([
  cachedHTML("../components/MovieCardRender.html"),
  cachedHTML("../components/TvShowCardRender.html"),
])
  .then(([movieHtml, tvHtml]) => {
    movieCardTemplate = movieHtml;
    tvCardTemplate = tvHtml;
    loadMovieGrids();
  })
  .catch((err) => console.error("Không tải được template:", err));

function getMediaTypeLabel(type) {
  const lang = localStorage.getItem("language") || document.documentElement.lang || "vi";
  if (type === "phim-le" || type === "movie") return lang === "vi" ? "Phim l\u1ebb" : "Movies";
  if (type === "phim-bo" || type === "tv") return lang === "vi" ? "Phim b\u1ed9" : "Series";
  if (type === "tv-shows" || type === "tvshows") return "TV Shows";
  return "";
}

function getCardType(type) {
  if (type === "phim-le" || type === "movie") return "phim-le";
  return "phim-bo";
}

function createCard(item, type) {
  const lang = localStorage.getItem("language") || document.documentElement.lang || "vi";
  const poster = item.poster_url ? imageUrl(item.poster_url) : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

  const titleDisplay = lang === "en" ? (item.origin_name || item.name) : (item.name || item.origin_name);
  const originalTitle = lang === "en" ? (item.origin_name || item.name || "") : (item.origin_name || "");

  const cardType = getCardType(type);
  const isMovie = cardType === "phim-le";
  const template = isMovie ? movieCardTemplate : tvCardTemplate;

  return template
    .replace(/{{id}}/g, item.slug || item._id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, titleDisplay)
    .replace(/{{original_title}}/g, originalTitle)
    .replace(/{{media_type_label}}/g, getMediaTypeLabel(type));
}

function renderGrid(gridId, items = [], type = "phim-le") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = "<p>Không có dữ liệu để hiển thị.</p>";
    return;
  }

  const limitedItems = items.slice(0, 12);

  limitedItems.forEach((item) => {
    const cardHTML = createCard(item, type);
    grid.insertAdjacentHTML("beforeend", cardHTML);
  });

  observeLazyImages();
}

async function fetchList(endpoint, limit = 12) {
  try {
    const data = await cachedFetch(`${KKPHIM_API}/v1/api/danh-sach/${endpoint}&limit=${limit}`, 5 * 60 * 1000);
    return data?.data?.items || [];
  } catch (err) {
    console.error("Lỗi khi fetch KKPHIM:", err);
    return [];
  }
}

async function fetchBySlug(slug) {
  try {
    const data = await cachedFetch(`${KKPHIM_API}/v1/api/phim/${slug}`, 30 * 60 * 1000);
    return data?.data?.item || null;
  } catch (err) {
    console.error(`Lỗi khi fetch slug ${slug}:`, err);
    return null;
  }
}

const PRIORITY_COUNTRIES = ["au-my", "nhat-ban", "han-quoc", "trung-quoc", "anh", "phap", "thai-lan", "dai-loan", "hong-kong", "an-do", "viet-nam"];

function sortByCountryPriority(items) {
  const priority = [];
  const other = [];
  for (const item of items) {
    const itemCountries = (item.country || []).map(c => c.slug);
    const isPriority = itemCountries.some(c => PRIORITY_COUNTRIES.includes(c));
    if (isPriority) priority.push(item);
    else other.push(item);
  }
  priority.sort((a, b) => (b.year || 0) - (a.year || 0));
  other.sort((a, b) => (b.year || 0) - (a.year || 0));
  return [...priority, ...other];
}

const TOP_MOVIE_SLUGS = [
  "nha-tu-shawshank",
  "bo-gia-1972",
  "ky-si-bong-dem",
  "bo-gia-2",
  "12-nguoi-dan-ong-gian-du-1997",
  "chua-te-cua-nhung-chiec-nhan-su-tro-lai-cua-nha-vua",
  "danh-sach-schindler",
  "chua-te-cua-nhung-chiec-nhan-hiep-hoi-nhan-than",
  "chuyen-tao-lao",
  "nguoi-tot-ke-xau-va-ten-vo-lai",
  "chua-te-cua-nhung-chiec-nhan-hai-toa-thap",
  "cuoc-doi-forrest-gump",
];

const TOP_TV_SLUGS = [
  "tap-lam-nguoi-xau-phan-1",
  "bong-ma-anh-quoc-phan-1",
  "duong-day-phan-1",
  "the-than-tiet-khi-su-cuoi-cung-cuon-1-thuy",
  "tham-hoa-hat-nhan",
  "gia-dinh-sopranos-phan-1",
  "tro-choi-vuong-quyen-phan-1",
  "sieu-anh-hung-pha-hoai-phan-1",
  "nhung-nguoi-ban-phan-1",
  "hanh-tinh-trai-dat-2",
  "hanh-tinh-xanh-ii",
  "anne-toc-do-phan-1",
];

async function loadMovieGrids() {
  try {
    const yearParams = "?sort_field=year&sort_type=desc";
    const viewParams = "?sort_field=view&sort_type=desc";

    const [
      phimChieuRap,
      phimBoRecent,
      topMovies,
      topTvSeries,
      popularSeries,
    ] = await Promise.all([
      fetchList(`phim-chieu-rap${yearParams}`, 24),
      fetchList(`phim-bo${yearParams}`, 24),
      Promise.all(TOP_MOVIE_SLUGS.map(fetchBySlug)),
      Promise.all(TOP_TV_SLUGS.map(fetchBySlug)),
      fetchList(`phim-bo${viewParams}`),
    ]);

    const validTopMovies = topMovies.filter(Boolean);
    const validTopTv = topTvSeries.filter(Boolean);

    const seriesList = [...validTopTv, ...popularSeries].slice(0, 12);

    renderGrid("movieGridNew", sortByCountryPriority(phimChieuRap), "phim-le");
    renderGrid("movieGridHot", sortByCountryPriority(phimBoRecent), "phim-bo");
    renderGrid("movieGridHighRate", validTopMovies, "phim-le");
    renderGrid("movieGridHotHit", seriesList, "phim-bo");
  } catch (error) {
    console.error("Lỗi khi load grids:", error);
  }
}

export const movieGrid = { renderGrid, createCard, loadMovieGrids };

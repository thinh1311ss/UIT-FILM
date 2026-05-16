import { KKPHIM_API } from "../config.js";

const IMG_CDN = "https://phimimg.com";
let movieCardTemplate = "";
let tvCardTemplate = "";

const GRID_CONFIG = [
  { id: "movieGridNew", type: "phim-le", label: "Phim lẻ mới" },
  { id: "movieGridHot", type: "phim-bo", label: "Phim bộ mới" },
  { id: "movieGridHighRate", type: "phim-le", label: "Phim lẻ đánh giá cao" },
  { id: "movieGridHotHit", type: "phim-bo", label: "Phim bộ xem nhiều" },
];

Promise.all([
  fetch("../components/MovieCardRender.html").then((r) => r.text()),
  fetch("../components/TvShowCardRender.html").then((r) => r.text()),
])
  .then(([movieHtml, tvHtml]) => {
    movieCardTemplate = movieHtml;
    tvCardTemplate = tvHtml;
    loadMovieGrids();
  })
  .catch((err) => console.error("Không tải được template:", err));

function createCard(item, type) {
  const poster = item.poster_url
    ? (item.poster_url.startsWith("http") ? item.poster_url : `${IMG_CDN}/${item.poster_url}`)
    : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

  const titleDisplay = item.name || item.origin_name;
  const originalTitle = item.origin_name || "";

  const isMovie = type === "phim-le";
  const template = isMovie ? movieCardTemplate : tvCardTemplate;

  return template
    .replace(/{{id}}/g, item.slug || item._id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, titleDisplay)
    .replace(/{{original_title}}/g, originalTitle);
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
}

async function fetchList(endpoint) {
  try {
    const res = await fetch(`${KKPHIM_API}/v1/api/danh-sach/${endpoint}&limit=12`);
    const data = await res.json();
    return data?.data?.items || [];
  } catch (err) {
    console.error("Lỗi khi fetch KKPHIM:", err);
    return [];
  }
}

async function loadMovieGrids() {
  try {
    const newestParams = "?sort_field=modified.time&sort_type=desc";
    const ratingParams = "?sort_field=rating&sort_type=desc";
    const viewParams = "?sort_field=view&sort_type=desc";

    const [phimLe, phimBo, topRated, popularShows] = await Promise.all([
      fetchList(`phim-le${newestParams}`),
      fetchList(`phim-bo${newestParams}`),
      fetchList(`phim-le${ratingParams}`),
      fetchList(`phim-bo${viewParams}`),
    ]);

    renderGrid("movieGridNew", phimLe, "phim-le");
    renderGrid("movieGridHot", phimBo, "phim-bo");
    renderGrid("movieGridHighRate", topRated, "phim-le");
    renderGrid("movieGridHotHit", popularShows, "phim-bo");
  } catch (error) {
    console.error("Lỗi khi load grids:", error);
  }
}

export const movieGrid = { renderGrid, createCard, loadMovieGrids };

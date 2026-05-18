import { KKPHIM_API } from "../config.js";
import { cachedFetch } from "../js/cache-utils.js";
import { observeLazyImages } from "../js/lazy-utils.js";
import { favoritesManager } from "./Favorite.js";

const IMG_CDN = "https://phimimg.com";

let movie = null;
let episodes = [];
let translations = {};

async function loadTranslations(lang) {
  try {
    translations = await cachedFetch(`../../public/locales/${lang}.json`, 30 * 60 * 1000);
  } catch (err) {}
}

function t(key) {
  return translations[key] || key;
}

function currentLang() {
  return (
    localStorage.getItem("language") || document.documentElement.lang || "vi"
  );
}

function translateDOM() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });
}

async function fetchDetail(slug) {
  try {
    const data = await cachedFetch(`${KKPHIM_API}/phim/${slug}`, 30 * 60 * 1000);
    movie = data.movie;
    episodes = data.episodes || [];

    const isTV = movie.type !== "single";

    window.currentMovie = {
      id: slug,
      slug: slug,
      title: movie.name || movie.origin_name,
      originalName: movie.origin_name,
      posterPath: movie.poster_url,
      type: isTV ? "TV" : "Movie",
    };

    renderPoster();
    renderTitle();
    renderOverview();
    renderRating();
    renderGenres();
    renderDirector();
    renderInfo();
    renderBackground();
    renderActors();
    renderEpisodeList();
    renderWatchButton();

    // Show episodes tab for TV series
    const epTab = document.querySelector('[data-tab="episodes"]');
    if (epTab) {
      epTab.style.display = isTV ? "" : episodes.length > 1 ? "" : "none";
    }

    updateFavoriteButtonState();
    initFavoriteButton();
  } catch (error) {
    console.error("Error fetching movie details:", error);
  }
}

function renderPoster() {
  document.querySelector(".movie-banner__poster img").src = movie.poster_url
    ? movie.poster_url
    : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";
}

function renderTitle() {
  document.querySelector(".movie-banner__title h3").textContent =
    movie.name || movie.origin_name;
}

function renderOverview() {
  document.querySelector(".movie-banner__overview").innerHTML = `
    <span>${t("detail.intro") || "Giới thiệu"}:</span><br>${
    movie.content || t("detail.noOverview") || "Chưa có thông tin giới thiệu."
  }`;
}

function renderRating() {
  const rating = movie.tmdb?.vote_average > 0
    ? movie.tmdb.vote_average.toFixed(1)
    : "N/A";
  document.querySelector(".movie-banner__rating span").textContent = rating;
}

function renderGenres() {
  document.querySelector(".movie-banner__genres").innerHTML =
    movie.category?.map((g) => `<span>${g.name}</span>`).join("") ||
    `<span>${t("common.unknown")}</span>`;
}

function renderDirector() {
  const director = movie.director?.join(", ") || t("common.unknown");
  document.querySelector(".movie-banner__director p").innerHTML = `
    <span>${t("detail.director") || "Đạo diễn"}:</span> ${director}
  `;
}

function renderInfo() {
  const panel = document.querySelector(".tab-panel--info");
  if (!panel) return;

  const flag = movie.country?.[0]?.slug || null;
  const flagHTML = flag
    ? `<img src="https://flagcdn.com/48x36/${
        flag === "nhat-ban" ? "jp" :
        flag === "trung-quoc" ? "cn" :
        flag === "han-quoc" ? "kr" :
        flag === "my" ? "us" :
        flag === "anh" ? "gb" :
        flag === "phap" ? "fr" :
        flag === "quoc-gia-khac" ? "un" : flag
      }.png" style="width:32px;height:24px;vertical-align:middle;">`
    : t("common.unknown");

  function translateStatus(status) {
    const statusMap = {
      ongoing: "detail.status.inproduction",
      completed: "detail.status.released",
      trailer: "detail.status.planned",
    };
    return t(statusMap[status]) || status || t("common.unknown");
  }

  panel.innerHTML = `
    <h3>${t("detail.infoTitle") || "Thông tin phim"}</h3>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.runtime") || "Thời lượng"
    }:</div><div class="movie-info__value">${
      movie.time || t("common.unknown")
    }</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.country") || "Quốc gia"
    }:</div><div class="movie-info__value">${flagHTML}</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.quality") || "Chất lượng"
    }:</div><div class="movie-info__value">${
      movie.quality || t("common.updating")
    }</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.lang") || "Ngôn ngữ"
    }:</div><div class="movie-info__value">${
      movie.lang || t("common.updating")
    }</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.status") || "Trạng thái"
    }:</div><div class="movie-info__value">${translateStatus(movie.status)}</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.year") || "Năm"
    }:</div><div class="movie-info__value">${
      movie.year || t("common.updating")
    }</div></div>
  `;
}

function renderBackground() {
  const bg = document.querySelector(".movie-banner__background");
  if (bg && movie.poster_url) {
    bg.style.backgroundImage = `url(${movie.poster_url})`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  }
}

function renderActors() {
  const container = document.querySelector(".actors-grid");
  const btn = document.querySelector(".tab-panel__view-more");
  if (!container) return;

  container.innerHTML = "";
  const actors = movie.actor || [];

  if (!actors.length) {
    container.innerHTML = `<p>${
      t("detail.noActors") || "Không có thông tin diễn viên."
    }</p>`;
    if (btn) btn.style.display = "none";
    return;
  }

  const actorsWithIndex = actors.map((name, i) => ({
    name,
    id: `actor-${i}`,
  }));

  container.dataset.allActors = JSON.stringify(actorsWithIndex);
  actorsWithIndex.slice(0, 5).forEach((a) =>
    container.insertAdjacentHTML(
      "beforeend",
      createActorHTML(a.name, a.id)
    )
  );

  if (btn) {
    const remain = actorsWithIndex.length - 5;
    btn.style.display = remain <= 0 ? "none" : "block";
    btn.textContent =
      remain > 0
        ? `${t("detail.viewMore") || "Xem thêm"} (${remain}) ▼`
        : t("detail.viewMore") || "Xem thêm";
  }
}

function createActorHTML(name, id) {
  const img = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&size=300&background=1a1a2e&color=0891b2`;

  return `
    <div class="cast-box">
      <div class="cast-card">
        <div class="cast-img"><img src="${img}" alt="${name}" /></div>
      </div>
      <div class="info">
        <h4 class="name">${name}</h4>
      </div>
    </div>`;
}

function renderEpisodeList() {
  const container = document.querySelector(".tab-panel--episodes");
  if (!container) return;

  if (!episodes.length) {
    container.innerHTML = "";
    return;
  }

  let html = `<h3>${t("detail.episodes") || "Danh sách tập"}</h3>`;

  episodes.forEach((server, si) => {
    if (!server.server_data?.length) return;

    html += `<div class="server-tabs">`;
    html += `<span class="server-tab active">${server.server_name}</span>`;
    html += `</div>`;
    html += `<div class="episode-grid">`;

    server.server_data.forEach((ep, ei) => {
      html += `<a href="WatchPage.html?slug=${movie.slug || window.currentMovie.slug}&server=${si}&ep=${ei}" class="episode-btn">
        ${ep.name}
      </a>`;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
}

function renderWatchButton() {
  const container = document.querySelector(".movie-banner__actions");
  if (!container) return;

  let watchBtn = container.querySelector(".watch-btn");
  if (!watchBtn) {
    watchBtn = document.createElement("a");
    watchBtn.className = "watch-btn";
    container.insertBefore(watchBtn, container.firstChild);
  }

  const slug = movie.slug || window.currentMovie?.slug;
  if (episodes.length > 0 && episodes[0].server_data?.length > 0) {
    watchBtn.href = `WatchPage.html?slug=${slug}&server=0&ep=0`;
    watchBtn.innerHTML = `<i class="fa-solid fa-play"></i> ${t("detail.watchNow") || "Xem ngay"}`;
  } else {
    watchBtn.innerHTML = `<i class="fa-solid fa-play"></i> ${t("detail.comingSoon") || "Sắp chiếu"}`;
    watchBtn.style.pointerEvents = "none";
    watchBtn.style.opacity = "0.5";
  }
}

async function loadRecommended(slug) {
  const container = document.getElementById("recommendations");
  if (!container) return;

  container.innerHTML = `<p>${t("common.loading") || "Đang tải..."}</p>`;

  try {
    const firstCat = movie.category?.[0]?.slug;
    if (!firstCat) {
      container.innerHTML = "";
      return;
    }

    const data = await cachedFetch(
      `${KKPHIM_API}/v1/api/the-loai/${firstCat}?sort_field=modified.time&sort_type=desc&limit=12`,
      5 * 60 * 1000
    );
    const items = (data?.data?.items || []).slice(0, 12);

    container.innerHTML = "";
    if (!items.length) {
      container.innerHTML = `<p>${
        t("detail.noRecs") || "Không có phim đề xuất."
      }</p>`;
      return;
    }

    items.forEach((item) => {
      const poster = item.poster_url
        ? (item.poster_url.startsWith("http") ? item.poster_url : `${IMG_CDN}/${item.poster_url}`)
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

      const html = `
        <div class="movie-box">
          <a class="movie-box__card" href="DetailPage.html?slug=${item.slug}">
            <div class="movie-box__info-top"><div class="movie-box__info-ep-top"><span>${item.type === "single" ? "Phim" : "Series"}</span></div></div>
            <div class="movie-box__poster"><img class="movie-box__poster-img lazy-img" data-src="${poster}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231a1a2e'/%3E%3C/svg%3E" alt="${item.name}" width="300" height="450" loading="lazy" decoding="async"></div>
          </a>
          <div class="movie-box__info">
            <h4 class="movie-box__vietnam-title"><a href="DetailPage.html?slug=${item.slug}">${item.name}</a></h4>
            <h4 class="movie-box__other-title"><a href="DetailPage.html?slug=${item.slug}">${item.origin_name}</a></h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
    observeLazyImages();
  } catch (e) {
    container.innerHTML = `<p>${
      t("detail.recError") || "Có lỗi khi tải đề xuất."
    }</p>`;
  }
}

function initTabs() {
  const tabs = document.querySelectorAll(".movie-tabs__item");
  const tabContents = document.querySelectorAll(".movie-tabs__content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      tabs.forEach((t) => t.classList.remove("movie-tabs__item--active"));
      tabContents.forEach((content) =>
        content.classList.remove("movie-tabs__content--active")
      );

      this.classList.add("movie-tabs__item--active");

      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("movie-tabs__content--active");
      }
    });
  });
}

function initViewMore() {
  const btn = document.querySelector(".tab-panel__view-more");
  const grid = document.querySelector(".actors-grid");
  if (!btn || !grid) return;

  btn.addEventListener("click", () => {
    const expanded = grid.classList.toggle("actors-grid--expanded");
    const all = JSON.parse(grid.dataset.allActors || "[]");
    grid.innerHTML = "";
    const toShow = expanded ? all : all.slice(0, 5);
    toShow.forEach((a) =>
      grid.insertAdjacentHTML(
        "beforeend",
        createActorHTML(a.name, a.id)
      )
    );
    btn.textContent = expanded
      ? `${t("detail.collapse") || "Thu gọn"} ▲`
      : `${t("detail.viewMore") || "Xem thêm"} (${all.length - 5}) ▼`;
  });
}

async function updateFavoriteButtonState() {
  const favoriteBtn = document.querySelector(
    ".movie-banner__button--like, .favorite-btn, .favorite"
  );
  if (!favoriteBtn || !window.currentMovie) return;

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (!token) {
    favoriteBtn.classList.remove("active");
    return;
  }

  try {
    const isFavorite = await favoritesManager.checkFavoriteStatus(
      window.currentMovie.slug
    );
    updateFavoriteButtonAppearance(favoriteBtn, isFavorite);
  } catch (error) {}
}

function updateFavoriteButtonAppearance(button, isFavorite) {
  const svg = button.querySelector("svg");
  const path = svg?.querySelector("path");

  if (isFavorite) {
    button.classList.add("active");
    if (path) path.style.fill = "#ff4444";
  } else {
    button.classList.remove("active");
    if (path) path.style.fill = "none";
  }
}

function initFavoriteButton() {
  const favoriteBtn = document.querySelector(
    ".movie-banner__button--like, .favorite-btn, .favorite"
  );
  if (!favoriteBtn) return;

  favoriteBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token || !favoritesManager.isValidToken(token)) {
      favoritesManager.showLoginPrompt();
      return;
    }

    if (!window.currentMovie) return;

    try {
      await favoritesManager.handleFavoriteClick(favoriteBtn, {
        id: window.currentMovie.slug,
        type: window.currentMovie.type,
        title: window.currentMovie.title,
        originalName: window.currentMovie.originalName,
        posterPath: window.currentMovie.posterPath,
      });

      updateFavoriteButtonState();
    } catch (error) {}
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug") || urlParams.get("id") || "";

  if (!slug) {
    document.querySelector(".movie-banner__title h3").textContent =
      "Không tìm thấy phim";
    return;
  }

  await loadTranslations(currentLang());
  await fetchDetail(slug);
  await loadRecommended(slug);
  initTabs();
  initViewMore();
});

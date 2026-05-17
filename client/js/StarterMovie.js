import { KKPHIM_API, API_URL } from "../config.js";
import { cachedFetch } from "../js/cache-utils.js";
import { favoritesManager } from "../js/Favorite.js";

const IMG_CDN = "https://phimimg.com";
const FALLBACK_POSTER = "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Image";
const FALLBACK_BG = "https://placehold.co/1920x1080/1a1a2e/0891b2?text=No+Image";

// DOM Elements
const slidesEl = document.getElementById("slides");
const brandEl = document.getElementById("brand");
const enEl = document.getElementById("en");
const metaEl = document.getElementById("meta");
const genresEl = document.getElementById("genres");
const descEl = document.getElementById("desc");
const thumbsEl = document.getElementById("thumbs");

const trailerModal = document.getElementById("trailer-modal");
const trailerFrame = document.getElementById("trailer-frame");
const closeTrailer = document.getElementById("close-trailer");
const trailerBtn = document.getElementById("playBtn") || document.getElementById("trailer-btn");
const infoBtn = document.querySelector("button[aria-label='Info']");
const favoriteBtn = document.querySelector(".favorite");

let movies = [];
let index = 0;
let timer;

// Add: Variable to store translations
// let translations = {};

// Add: Function to load translations
let translations = {};

async function loadTranslations() {
  const lang = getLang();
  try {
    translations = await cachedFetch(`../../public/locales/${lang}.json`, 30 * 60 * 1000);
  } catch (err) {
    console.error("Load translations error:", err);
    translations = {};
  }
}

// Function to translate by key
function t(key) {
  return translations[key] || key;
}

// Language & Cache
function getLang() {
  const stored = localStorage.getItem("language");
  const htmlLang = document.documentElement.lang;
  if (stored && stored !== htmlLang) {
    document.documentElement.lang = stored;
    return stored;
  }
  if (htmlLang && htmlLang !== stored) {
    localStorage.setItem("language", htmlLang);
    return htmlLang;
  }
  return stored || htmlLang || "vi";
}





// DOM Creation
const createEl = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
};

const badge = (content, cls) =>
  createEl("div", `badge${cls ? " " + cls : ""}`, content);

function createSlide(movie, isActive) {
  const wrap = createEl("div", `slide${isActive ? " active" : ""}`);
  const img = createEl("img", "bg");
  img.src = movie.backgroundImage;
  img.alt = movie.title;
  wrap.append(img, createEl("div", "overlay-v"), createEl("div", "overlay-h"));
  return wrap;
}

function renderBackground() {
  if (!slidesEl) return;
  slidesEl.replaceChildren(
    ...movies.map((m, i) => createSlide(m, i === index))
  );
}

function renderContent() {
  const m = movies[index];
  if (!m) return;

  if (brandEl) brandEl.alt = m.title;
  if (enEl) enEl.textContent = m.title || "";

  if (metaEl) {
    metaEl.innerHTML = "";
    const metaData = [
      badge("<b>HD</b>", "grad"),
      badge("<b>PG-13</b>", "white"),
      badge(
        `<span class="imdb">IMDb</span><span>${m.imdbRating}</span>`,
        "outline-yellow"
      ),
      badge(`<span>${m.year}</span>`),
      badge(`<span>${m.duration}</span>`),
    ];
    metaEl.append(...metaData);
  }

  if (genresEl) {
    genresEl.innerHTML = "";
    m.genres
      .slice(0, 4)
      .forEach((g) => genresEl.append(badge(`<span>${g}</span>`)));
    if (m.genres.length > 4)
      genresEl.append(badge(`<span>+${m.genres.length - 4}</span>`));
  }

  if (descEl) {
    descEl.classList.remove("expanded");
    descEl.textContent = m.description;

    const oldToggle = descEl.nextElementSibling;
    if (oldToggle && oldToggle.classList.contains("desc-toggle")) {
      oldToggle.remove();
    }

    if (m.description.length > 200) {
      const toggleBtn = document.createElement("span");
      toggleBtn.className = "desc-toggle";
      toggleBtn.textContent = "Xem thêm";

      toggleBtn.onclick = () => {
        const expanded = descEl.classList.toggle("expanded");
        toggleBtn.textContent = expanded ? "Thu gọn" : "Xem thêm";
      };

      descEl.after(toggleBtn);
    }
  }

  updateFavoriteButtonState();
}

function renderThumbs() {
  if (!thumbsEl) return;
  thumbsEl.replaceChildren(
    ...movies.map((m, i) => {
      const b = createEl("button", `thumb${i === index ? " active" : ""}`);
      b.ariaLabel = m.title;
      const img = createEl("img");
      img.src = m.thumbnailImage;
      img.alt = m.title;
      b.append(img);
      b.onclick = () => {
        index = i;
        update(true);
      };
      return b;
    })
  );
}

function update(stopAuto = false) {
  renderBackground();
  renderContent();
  renderThumbs();

  if (stopAuto) {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }
}

function next() {
  index = (index + 1) % movies.length;
  update();
}

// Trailer Logic
async function getTrailerUrl(slug) {
  try {
    const data = await cachedFetch(`${KKPHIM_API}/phim/${slug}`, 10 * 60 * 1000);
    const trailerUrl = data?.movie?.trailer_url;
    if (trailerUrl) {
      const match = trailerUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
      );
      if (match) return match[1];
    }
    return null;
  } catch (err) {
    console.error("Lỗi lấy trailer:", err);
    return null;
  }
}

// Logic Favorite
async function updateFavoriteButtonState() {
  const currentMovie = movies[index];
  if (!currentMovie || !favoriteBtn) return;

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  if (!token) {
    resetFavoriteButton();
    return;
  }

  try {
    const isFavorite = await favoritesManager.checkFavoriteStatus(
      currentMovie.id
    );

    if (isFavorite) {
      favoriteBtn.classList.add("active");
      const path = favoriteBtn.querySelector("path");
      if (path) path.style.fill = "#ff4444";
    } else {
      resetFavoriteButton();
    }
  } catch (error) {
    console.error("Error checking favorite status:", error);
    resetFavoriteButton();
  }
}

function resetFavoriteButton() {
  favoriteBtn.classList.remove("active");
  const path = favoriteBtn.querySelector("path");
  if (path) path.style.fill = "#fff";
}

// Fix: Function notification use translation
function showSimpleNotification(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 300px;
  `;

  if (type === "success") {
    toast.style.backgroundColor = "#4CAF50";
  } else if (type === "error") {
    toast.style.backgroundColor = "#f44336";
  } else {
    toast.style.backgroundColor = "#2196F3";
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  }, 100);

  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// ========== Data Fetching ==========
async function fetchMovies() {
  try {
    const lang = getLang();
    console.log("Fetching movies with language:", lang);

    const data = await cachedFetch(
      `${KKPHIM_API}/v1/api/danh-sach/phim-le?sort_field=view&sort_type=desc&limit=6`,
      10 * 60 * 1000
    );
    const items = data?.data?.items || [];

    if (!items.length) {
      console.warn("No movies returned from KKPHIM");
      return;
    }

    const slugs = items.slice(0, 6);

    // Compute first slide's background URL from list data (no detail API needed)
    const firstItem = slugs[0];
    const firstBg = firstItem.thumb_url
      ? (firstItem.thumb_url.startsWith("http") ? firstItem.thumb_url : `${IMG_CDN}/${firstItem.thumb_url}`)
      : (firstItem.poster_url
        ? (firstItem.poster_url.startsWith("http") ? firstItem.poster_url : `${IMG_CDN}/${firstItem.poster_url}`)
        : FALLBACK_BG);

    // Preload LCP image immediately — before detail API call
    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    preloadLink.fetchPriority = "high";
    preloadLink.href = firstBg;
    document.head.appendChild(preloadLink);

    // Fetch slide 1 detail
    const firstDetailData = await cachedFetch(`${KKPHIM_API}/phim/${firstItem.slug}`, 10 * 60 * 1000);
    const firstMovie = firstDetailData.movie;

    let overview = (firstMovie?.content || "").trim();
    if (!overview) overview = lang === "vi" ? "Không có mô tả." : "No overview available.";

    const tUrl = firstItem.thumb_url
      ? (firstItem.thumb_url.startsWith("http") ? firstItem.thumb_url : `${IMG_CDN}/${firstItem.thumb_url}`)
      : "";
    const pUrl = firstItem.poster_url
      ? (firstItem.poster_url.startsWith("http") ? firstItem.poster_url : `${IMG_CDN}/${firstItem.poster_url}`)
      : "";

    const firstMovieData = {
      id: firstItem.slug,
      slug: firstItem.slug,
      title: firstItem.name || firstItem.origin_name,
      englishTitle: firstItem.origin_name || firstItem.name,
      backgroundImage: tUrl || pUrl || FALLBACK_BG,
      thumbnailImage: pUrl || FALLBACK_POSTER,
      imdbRating: firstMovie?.tmdb?.vote_average > 0 ? firstMovie.tmdb.vote_average.toFixed(1) : "N/A",
      year: firstItem.year ? String(firstItem.year) : "N/A",
      duration: firstItem.time || "N/A",
      genres: firstItem.category?.map((g) => g.name) || [],
      description: overview,
    };

    movies = [firstMovieData];
    index = 0;

    // Clear old slides and render slide 1 immediately
    if (slidesEl) slidesEl.innerHTML = "";
    renderSingleSlide(firstMovieData, 0, true);
    renderContent();

    // Fetch slides 2-6 via requestIdleCallback (deferred)
    const rIC = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    rIC(async () => {
      const restResults = await Promise.all(
        slugs.slice(1).map(async (item) => {
          try {
            const detailData = await cachedFetch(`${KKPHIM_API}/phim/${item.slug}`, 10 * 60 * 1000);
            const movie = detailData.movie;
            const tUrl2 = item.thumb_url
              ? (item.thumb_url.startsWith("http") ? item.thumb_url : `${IMG_CDN}/${item.thumb_url}`)
              : "";
            const pUrl2 = item.poster_url
              ? (item.poster_url.startsWith("http") ? item.poster_url : `${IMG_CDN}/${item.poster_url}`)
              : "";
            let ov = (movie?.content || "").trim();
            if (!ov) ov = lang === "vi" ? "Không có mô tả." : "No overview available.";
            return {
              id: item.slug,
              slug: item.slug,
              title: item.name || item.origin_name,
              englishTitle: item.origin_name || item.name,
              backgroundImage: tUrl2 || pUrl2 || FALLBACK_BG,
              thumbnailImage: pUrl2 || FALLBACK_POSTER,
              imdbRating: movie?.tmdb?.vote_average > 0 ? movie.tmdb.vote_average.toFixed(1) : "N/A",
              year: item.year ? String(item.year) : "N/A",
              duration: item.time || "N/A",
              genres: item.category?.map((g) => g.name) || [],
              description: ov,
            };
          } catch (err) {
            console.warn("Error fetching movie", item.slug, err);
            return null;
          }
        })
      );

      const validRest = restResults.filter(Boolean);
      movies = [firstMovieData, ...validRest];

      if (validRest.length > 0) {
        validRest.forEach((m, i) => renderSingleSlide(m, i + 1, false));
        renderThumbs();
        clearInterval(timer);
        timer = setInterval(next, 5000);
      }
    });
  } catch (err) {
    console.error("Fetch KKPHIM failed:", err);
  }
}

function renderSingleSlide(movieData, slideIndex, isActive) {
  if (!slidesEl) return;
  const slide = createSlide(movieData, isActive);
  if (slideIndex === 0) {
    const img = slide.querySelector("img.bg");
    if (img) {
      img.fetchPriority = "high";
      img.loading = "eager";
    }
  }
  const existing = slidesEl.children[slideIndex];
  if (existing) {
    slidesEl.replaceChild(slide, existing);
  } else {
    slidesEl.appendChild(slide);
  }
}

// Event Listeners
// Trailer Button Event
if (trailerBtn) {
  trailerBtn.addEventListener("click", async () => {
    const currentMovie = movies[index];
    if (!currentMovie) return;

    const key = await getTrailerUrl(currentMovie.slug);
    if (!key) {
      alert("Xin lỗi, không tìm thấy trailer cho phim này.");
      return;
    }

    trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
    trailerModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });
}

function closeModal() {
  trailerModal.style.display = "none";
  trailerFrame.src = "";
  document.body.style.overflow = "";
}

if (closeTrailer) {
  closeTrailer.addEventListener("click", closeModal);
}

if (trailerModal) {
  window.addEventListener("click", (e) => {
    if (e.target === trailerModal) closeModal();
  });
}

// Fix: Favorite Button Event with multiple languages
if (favoriteBtn) {
  favoriteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const currentMovie = movies[index];
    if (!currentMovie) {
      console.warn("No movie selected");
      return;
    }

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      // Fix: Use t() to get translation
      showSimpleNotification(t("favorite.loginRequired"), "info");
      return;
    }

    try {
      favoriteBtn.disabled = true;

      const filmData = {
        id: currentMovie.id.toString(),
        type: "Movie",
        title: currentMovie.title,
        originalName: currentMovie.englishTitle,
        posterPath: currentMovie.thumbnailImage,
      };

      const response = await fetch(`${API_URL}/api/favorites/toggle`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filmData),
      });

      const data = await response.json();

      if (response.ok) {
        // Fix: Use t() to get translation
        const message = data.action === "added" 
          ? t("favorite.addSuccess")
          : t("favorite.removeSuccess");
        showSimpleNotification(message, "success");
        
        // Update button UI
        const path = favoriteBtn.querySelector("path");
        if (path) {
          if (data.action === "added") {
            path.style.fill = "#ff4444";
            favoriteBtn.classList.add("active");
          } else {
            path.style.fill = "#fff";
            favoriteBtn.classList.remove("active");
          }
        }
      } else {
        // Fix: Use t() to get translation
        showSimpleNotification(data.message || t("favorite.error"), "error");
      }
    } catch (error) {
      console.error("Favorite error:", error);
      // Fix: Use t() to get translation
      showSimpleNotification(t("favorite.error"), "error");
    } finally {
      favoriteBtn.disabled = false;
    }
  });
}

// Watch Button (Xem ngay)
const watchBtn = document.getElementById("watch-btn");
if (watchBtn) {
  watchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const currentMovie = movies[index];
    if (!currentMovie) return;
    window.location.href = `../pages/DetailPage.html?slug=${currentMovie.slug}`;
  });
}

// Info Button
if (infoBtn) {
  infoBtn.addEventListener("click", () => {
    const currentMovie = movies[index];
    if (!currentMovie) return;
    window.location.href = `../pages/DetailPage.html?slug=${currentMovie.slug}`;
  });
}

// Listen for language change
window.addEventListener("languagechange", async () => {
  console.log("🔄 Language changed, reloading movies...");
  clearInterval(timer);
  movies = [];
  index = 0;
  await loadTranslations(); // Fix: Reload translations
  await fetchMovies();
});

// Listen for storage change
window.addEventListener("storage", async (e) => {
  if (e.key === "language") {
    console.log("🔄 Language changed in another tab, reloading...");
    clearInterval(timer);
    movies = [];
    index = 0;
    await loadTranslations(); // Fix: Reload translations
    await fetchMovies();
  }
});

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
  await loadTranslations(); // Fix: Load translations first
  await fetchMovies();
});

export const starterMovie = { update, fetchMovies };
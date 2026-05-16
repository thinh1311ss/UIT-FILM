import { KKPHIM_API } from "../config.js";
const IMG_CDN = "https://phimimg.com";

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
let currentServer = parseInt(params.get("server")) || 0;
let currentEp = parseInt(params.get("ep")) || 0;

let movie = null;
let episodes = [];


async function fetchMovie() {
  try {
    const res = await fetch(`${KKPHIM_API}/phim/${slug}`);
    if (!res.ok) throw new Error("Movie not found");
    const data = await res.json();
    movie = data.movie;
    episodes = data.episodes || [];

    document.title = `${movie.name} - Xem phim`;
    document.getElementById("movie-title").textContent = movie.name;
    document.getElementById("quality-label").textContent = movie.quality || "HD";
    document.getElementById("detail-link").href = `DetailPage.html?slug=${slug}`;

    renderServers();
    renderEpisodeGrid();
    renderRelatedMovies();

    loadVideo(currentServer, currentEp);
  } catch (error) {
    document.getElementById("movie-title").textContent = "Không tìm thấy phim";
    document.getElementById("player-loading").innerHTML = `
      <div style="text-align:center;color:#999;padding:40px;">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <p>Không tìm thấy phim</p>
      </div>`;
  }
}

function renderServers() {
  const container = document.getElementById("server-tabs");
  container.innerHTML = "";

  episodes.forEach((server, i) => {
    const btn = document.createElement("button");
    btn.className = `server-tab${i === currentServer ? " active" : ""}`;
    btn.textContent = server.server_name || `Server ${i + 1}`;
    btn.addEventListener("click", () => {
      currentServer = i;
      currentEp = 0;
      renderServers();
      renderEpisodeGrid();
      loadVideo(currentServer, currentEp);
      updateUrl();
    });
    container.appendChild(btn);
  });
}

function renderEpisodeGrid() {
  const container = document.getElementById("episode-grid");
  container.innerHTML = "";

  const serverData = episodes[currentServer]?.server_data;
  if (!serverData?.length) {
    container.innerHTML = "<p style='color:#666;'>Chưa có tập phim</p>";
    return;
  }

  serverData.forEach((ep, i) => {
    const btn = document.createElement("a");
    btn.className = `episode-btn${i === currentEp ? " active" : ""}`;
    btn.textContent = ep.name;
    btn.href = `WatchPage.html?slug=${slug}&server=${currentServer}&ep=${i}`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      currentEp = i;
      renderEpisodeGrid();
      loadVideo(currentServer, currentEp);
      updateUrl();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    container.appendChild(btn);
  });
}

function loadVideo(serverIdx, epIdx) {
  const container = document.getElementById("player-container");
  const serverData = episodes[serverIdx]?.server_data;
  if (!serverData?.[epIdx]) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">
        <p>Không tìm thấy video</p>
      </div>`;
    return;
  }

  const ep = serverData[epIdx];
  const episodeLabel = document.getElementById("episode-label");
  episodeLabel.textContent = ep.name;

  const linkM3U8 = ep.link_m3u8 || "";
  const linkEmbed = ep.link_embed || "";
  const linkDirect = ep.link_direct || "";

  if (linkEmbed) {
    loadEmbed(linkEmbed, container, ep);
  } else if (linkM3U8) {
    loadHLS(linkM3U8, container, ep);
  } else if (linkDirect) {
    loadDirectVideo(linkDirect, container, ep);
  } else {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">
        <p>Không có link phát</p>
      </div>`;
  }
}

function attemptPlay(video) {
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      showPlayOverlay(video);
    });
  }
}

function showPlayOverlay(video) {
  const container = video.closest("#player-container");
  if (!container || container.querySelector(".play-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "play-overlay";
  overlay.innerHTML = `
    <button class="play-overlay__btn">
      <i class="fas fa-play fa-3x"></i><br>
      <span>Nhấn để phát</span>
    </button>
  `;
  overlay.style.cssText = `
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.6);z-index:10;cursor:pointer;
  `;
  overlay.querySelector("button").style.cssText = `
    background:none;border:none;color:#fff;cursor:pointer;text-align:center;
  `;
  overlay.addEventListener("click", (e) => {
    if (e.target.closest(".play-overlay__btn")) {
      video.muted = false;
      video.play().then(() => overlay.remove()).catch(() => {});
    }
  });
  container.style.position = "relative";
  container.appendChild(overlay);
}

function loadHLS(url, container, ep) {
  container.innerHTML = `<video class="hls-player" controls autoplay muted playsinline></video>`;
  const video = container.querySelector("video");

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    attemptPlay(video);
  } else if (window.Hls) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => attemptPlay(video));
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error("HLS fatal error, trying embed fallback");
        loadEmbed(url, container, ep);
      }
    });
  } else {
    loadEmbed(url, container, ep);
  }

  setupAutoNext(video, ep);
  saveWatchProgress(video, ep);
}

function loadEmbed(url, container, ep) {
  const isAlreadyPlayer = url.includes("player.phimapi.com");
  const src = (!isAlreadyPlayer && url.includes(".m3u8"))
    ? `https://player.phimapi.com/player/?url=${encodeURIComponent(url)}`
    : url;
  container.innerHTML = `<iframe
    src="${src}"
    allow="autoplay; encrypted-media"
    allowfullscreen
    style="width:100%;height:100%;border:none;"
  ></iframe>`;
}

function loadDirectVideo(url, container, ep) {
  container.innerHTML = `<video class="hls-player" controls autoplay muted playsinline>
    <source src="${url}" type="video/mp4">
    Trình duyệt không hỗ trợ phát video.
  </video>`;
  const video = container.querySelector("video");
  attemptPlay(video);
  setupAutoNext(video, ep);
  saveWatchProgress(video, ep);
}

function setupAutoNext(video, ep) {
  video.addEventListener("ended", () => {
    const serverData = episodes[currentServer]?.server_data;
    if (serverData && currentEp < serverData.length - 1) {
      if (confirm(`Đã hết tập ${ep.name}. Chuyển sang tập tiếp theo?`)) {
        currentEp++;
        renderEpisodeGrid();
        loadVideo(currentServer, currentEp);
        updateUrl();
      }
    }
  });
}

function saveWatchProgress(video, ep) {
  if (!slug) return;
  const storageKey = `watch_${slug}`;

  video.addEventListener("timeupdate", () => {
    if (video.duration && video.currentTime > 0) {
      const progress = { ep: currentEp, server: currentServer, time: video.currentTime, duration: video.duration, updated: Date.now() };
      try {
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (e) {}
    }
  });

  // Resume from saved position
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const progress = JSON.parse(saved);
      if (progress.ep === currentEp && progress.server === currentServer) {
        video.addEventListener("loadedmetadata", () => {
          if (video.duration && progress.time > 30 && progress.time < video.duration - 10) {
            video.currentTime = progress.time;
          }
        }, { once: true });
      }
    }
  } catch (e) {}
}

async function renderRelatedMovies() {
  const container = document.getElementById("related-movies");
  if (!container || !movie?.category?.length) {
    if (container) container.innerHTML = "";
    return;
  }

  try {
    const cats = movie.category.map(c => c.slug).filter(Boolean);
    const isSingle = movie.type === "single";
    const seen = new Set([slug]);

    let related = [];

    for (const catSlug of cats) {
      if (related.length >= 12) break;
      const res = await fetch(`${KKPHIM_API}/v1/api/the-loai/${catSlug}?limit=18`);
      const data = await res.json();
      const items = data?.data?.items || [];
      for (const item of items) {
        if (related.length >= 12) break;
        if (seen.has(item.slug)) continue;
        seen.add(item.slug);
        const sameType = isSingle ? item.type === "single" : item.type !== "single";
        if (sameType) {
          related.push(item);
        }
      }
    }

    container.innerHTML = "";
    if (!related.length) {
      container.innerHTML = "<p style='color:#666;'>Không có phim liên quan.</p>";
      return;
    }

    related.slice(0, 12).forEach((item) => {
      const poster = item.poster_url
        ? (item.poster_url.startsWith("http") ? item.poster_url : `${IMG_CDN}/${item.poster_url}`)
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
      const html = `
        <div class="movie-box">
          <a class="movie-box__card" href="../pages/DetailPage.html?slug=${item.slug}">
            <div class="movie-box__poster">
              <img class="movie-box__poster-img" src="${poster}" alt="${item.name}">
            </div>
          </a>
          <div class="movie-box__info">
            <h4 class="movie-box__vietnam-title">
              <a href="../pages/DetailPage.html?slug=${item.slug}">${item.name}</a>
            </h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (e) {
    container.innerHTML = "";
  }
}

    items.forEach((item) => {
      const poster = item.poster_url
        ? (item.poster_url.startsWith("http") ? item.poster_url : `${IMG_CDN}/${item.poster_url}`)
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
      const html = `
        <div class="movie-box">
          <a class="movie-box__card" href="../pages/DetailPage.html?slug=${item.slug}">
            <div class="movie-box__poster">
              <img class="movie-box__poster-img" src="${poster}" alt="${item.name}">
            </div>
          </a>
          <div class="movie-box__info">
            <h4 class="movie-box__vietnam-title">
              <a href="../pages/DetailPage.html?slug=${item.slug}">${item.name}</a>
            </h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (e) {
    container.innerHTML = "";
  }
}

function updateUrl() {
  const url = `WatchPage.html?slug=${slug}&server=${currentServer}&ep=${currentEp}`;
  window.history.replaceState(null, "", url);
}

async function init() {
  if (!slug) {
    document.getElementById("movie-title").textContent = "Thiếu slug phim";
    return;
  }
  await fetchMovie();
}

init();

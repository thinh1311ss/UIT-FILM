import { KKPHIM_API } from "../config.js";

const trailerBtn = document.getElementById("trailer-btn");
const trailerModal = document.getElementById("trailer-modal");
const trailerContainer = document.getElementById("trailer-container");
const closeTrailer = document.getElementById("close-trailer");

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug") || "";

// Get trailer URL from movie detail
async function getTrailerUrl() {
  // First check if currentMovie is set globally
  if (window.currentMovie?.trailerUrl) {
    return window.currentMovie.trailerUrl;
  }

  if (!slug) return null;

  try {
    const res = await fetch(`${KKPHIM_API}/phim/${slug}`);
    const data = await res.json();
    return data.movie?.trailer_url || null;
  } catch {
    return null;
  }
}

// Open trailer
if (trailerBtn) {
  trailerBtn.addEventListener("click", async () => {
    const trailerUrl = await getTrailerUrl();
    if (!trailerUrl) {
      alert("Không tìm thấy trailer.");
      return;
    }

    const match = trailerUrl.match(/(?:v=|\/)([\w-]{11})/);
    const key = match ? match[1] : null;

    trailerContainer.innerHTML = key
      ? `<iframe width="100%" height="500" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen
          src="https://www.youtube.com/embed/${key}?autoplay=1&enablejsapi=1"></iframe>`
      : `<iframe width="100%" height="500" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen
          src="${trailerUrl}"></iframe>`;

    trailerModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });
}

// Close trailer
function closeModal() {
  if (trailerModal) {
    trailerModal.style.display = "none";
    trailerContainer.innerHTML = "";
    document.body.style.overflow = "";
  }
}

if (closeTrailer) closeTrailer.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
  if (e.target === trailerModal) closeModal();
});

const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const KKPHIM_API = "https://phimapi.com";
export const API_URL = isDev
  ? "http://localhost:5000"
  : "https://uit-film.onrender.com";

const IMG_CDN = "https://phimimg.com";

export function imageUrl(src) {
  if (!src) return "";
  const fullUrl = src.startsWith("http") ? src : `${IMG_CDN}/${src}`;
  if (fullUrl.includes("placehold.co") || fullUrl.includes("ui-avatars.com")) return fullUrl;
  return `${KKPHIM_API}/image.php?url=${encodeURIComponent(fullUrl)}`;
}

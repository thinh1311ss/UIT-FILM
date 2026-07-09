const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const KKPHIM_API = "https://phimapi.com";
export const API_URL = isDev
  ? "http://localhost:5000"
  : "https://uit-film.onrender.com";

const IMG_CDN = "https://img.phimapi.com";

export function imageUrl(src) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.includes("placehold.co") || src.includes("ui-avatars.com")) return src;
  if (src.startsWith("/")) return `${IMG_CDN}${src}`;
  return `${IMG_CDN}/${src}`;
}

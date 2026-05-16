const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const KKPHIM_API = "https://phimapi.com";
export const API_URL = isDev
  ? "http://localhost:5000"
  : "https://uit-film.onrender.com";

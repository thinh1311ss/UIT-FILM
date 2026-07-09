import { KKPHIM_API } from "../config.js";
import { cachedFetch } from "./cache-utils.js";

export function extractItems(resp) {
  if (!resp) return [];
  const d = resp.data;
  if (d?.items) return d.items;
  if (resp.items) return resp.items;
  if (d?.item) return [d.item];
  return [];
}

export function extractPaginate(resp) {
  if (!resp) return null;
  const d = resp.data;
  if (d?.params?.pagination) return d.params.pagination;
  if (d?.paginate) return d.paginate;
  if (resp.pagination) return resp.pagination;
  if (resp.paginate) return resp.paginate;
  return null;
}

export function extractMovie(resp) {
  if (!resp) return null;
  if (resp.movie) return resp.movie;
  const d = resp.data;
  if (d?.item) return d.item;
  if (d?.movie) return d.movie;
  return null;
}

export function extractEpisodes(resp) {
  if (!resp) return [];
  if (resp.episodes) return resp.episodes;
  const d = resp.data;
  if (d?.item?.episodes) return d.item.episodes;
  if (d?.episodes) return d.episodes;
  return [];
}

export function extractTotalPage(resp) {
  const p = extractPaginate(resp);
  if (p?.total_page) return p.total_page;
  if (p?.totalPages) return p.totalPages;
  if (p?.totalItems && p?.totalItemsPerPage) return Math.ceil(p.totalItems / p.totalItemsPerPage);
  if (p?.pageRanges) return p.pageRanges;
  if (resp?.data?.totalPages) return resp.data.totalPages;
  if (resp?.totalPages) return resp.totalPages;
  return null;
}

export function estimateMaxPages(resp, limit) {
  const apiPages = extractTotalPage(resp);
  if (apiPages !== null && apiPages !== undefined) return Number(apiPages);
  const itms = extractItems(resp);
  if (itms.length === 0) return 1;
  if (itms.length >= limit) return 10;
  return 1;
}

export async function apiFetch(url, ttl = 5 * 60 * 1000) {
  return cachedFetch(url.startsWith("http") ? url : `${KKPHIM_API}${url}`, ttl);
}

export function stripHTML(str) {
  if (!str) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = str;
  return tmp.textContent || tmp.innerText || "";
}
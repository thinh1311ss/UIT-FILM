# Performance Baseline Report — UIT FILM

**Date:** 2026-05-17  
**URL:** https://uit-film-36.vercel.app/  
**Test Page:** HomePage.html  
**Tool:** Lighthouse (Chrome Headless)  

---

## 1. Current Scores

| Metric | Value | Score | Target |
|--------|-------|-------|--------|
| **Performance Score** | **25** | 0.25 | ≥ 90 |
| **Largest Contentful Paint (LCP)** | **21.4 s** | 0.00 | ≤ 2.5 s |
| **First Contentful Paint (FCP)** | 1.2 s | — | ≤ 1.8 s |
| **Speed Index** | 5.0 s | 0.63 | ≤ 3.4 s |
| **Total Blocking Time (TBT)** | **2,010 ms** | 0.07 | ≤ 200 ms |
| **Cumulative Layout Shift (CLS)** | **0.388** | 0.26 | ≤ 0.1 |
| **Max Potential FID** | 1,190 ms | — | ≤ 100 ms |
| **DOM Size** | 839 elements | 0 | ≤ 1,500 |
| **Total Page Weight** | 17,512 KiB | — | ≤ 2,000 KiB |
| **Main Thread Work** | 7.6 s | — | — |

---

## 2. Issues Found

### 2.1 Images Missing `loading="lazy"` and/or `width`/`height`

| # | File | Line | Image | Missing Attributes | Impact |
|---|------|------|-------|--------------------|--------|
| 1 | `client/view/components/Header.html` | 12 | Logo.svg | `loading="lazy"`, `width`, `height` | Low |
| 2 | `client/view/components/Header.html` | 23 | Flag_of_Vietnam.svg | `loading="lazy"`, `width`, `height` | Low |
| 3 | `client/view/components/Header.html` | 34 | Flag_of_Vietnam.svg | `loading="lazy"`, `width`, `height` | Low |
| 4 | `client/view/components/Header.html` | 42 | English-flag.svg | `loading="lazy"`, `width`, `height` | Low |
| 5 | `client/view/components/Header.html` | 160 | English-flag.svg | `loading="lazy"`, `width`, `height` | Low |
| 6 | `client/view/components/Header.html` | 171 | Flag_of_Vietnam.svg | `loading="lazy"`, `width`, `height` | Low |
| 7 | `client/view/components/Header.html` | 179 | English-flag.svg | `loading="lazy"`, `width`, `height` | Low |
| 8 | `client/view/components/Header.html` | 204 | vn_flag.svg (avatar) | `loading="lazy"`, `width`, `height` | Low |
| 9 | `client/view/components/Footer.html` | 7 | vn_flag.svg | `loading="lazy"`, `width`, `height` | Low |
| 10 | `client/view/components/Footer.html` | 15 | Logo.svg | `loading="lazy"`, `width`, `height` | Low |
| 11 | `client/view/pages/DetailPage.html` | 50 | Poster placeholder | `width`, `height` | Medium |
| 12 | `client/view/components/MovieCardRender.html` | 8 | `{{poster}}` (template) | `loading="lazy"`, `width`, `height` | **High** |
| 13 | `client/view/components/TvShowCardRender.html` | 8 | `{{poster}}` (template) | `loading="lazy"`, `width`, `height` | **High** |
| 14 | `client/view/components/UserDetailMain.html` | 8 | External avatar URL | `loading="lazy"`, `width`, `height` | Low |
| 15 | `client/view/components/StarterMovie.html` | 7 | Brand image | `width`, `height` | Medium |

> **Impact:** **High** — Dynamically loaded poster images (MovieCardRender, TvShowCardRender) are the largest contributor to the 17.5 MB total weight. Without lazy loading, all hero carousel posters load immediately. Without explicit `width`/`height`, CLS is triggered.

---

### 2.2 Render-Blocking Scripts

| # | File | Line | Script | Problem | Impact |
|---|------|------|--------|---------|--------|
| 1 | `client/view/pages/WatchPage.html` | 14 | `vendor/js/hls.min.js` (235 KB) | No `defer`/`async`, no `type="module"` | **High** |

> All other `<script>` tags use `type="module"`, which defers by default. Only `hls.min.js` on WatchPage is truly render-blocking.

---

### 2.3 Iframe / Video Embeds

| # | File | Line | Tag | Purpose | Impact |
|---|------|------|-----|---------|--------|
| 1 | `client/view/pages/HomePage.html` | 101 | `<iframe id="trailer-frame">` | Trailer modal | Low |
| 2 | `client/view/pages/DetailPage.html` | 216 | `<iframe id="trailer-frame">` | Trailer modal | Low |
| 3 | `client/view/components/StarterMovie.html` | 61 | `<iframe id="trailer-frame">` | Trailer modal | Low |

> No `<video>` tags found. Iframes are loaded lazily on user interaction (modal open), so impact is minimal.

---

### 2.4 Unminified CSS & JS Sizes

#### CSS

| File Group | Total Size (KB) | Minified? | Impact |
|------------|----------------|-----------|--------|
| App CSS (`client/Style/*.css`) | **142.4 KB** | No | **High** |
| — Largest: `AdminPage.css` | 26.7 KB | No | |
| — Second: `MovieDetail.css` | 24.5 KB | No | |
| — Third: `HeaderAndFooter.css` | 20.5 KB | No | |
| Vendor CSS (`client/vendor/css/*.css`) | **165.9 KB** | Yes (boxicons, fontawesome) | Low |
| **Total CSS** | **308.3 KB** | — | **High** |

#### JavaScript

| File Group | Total Size (KB) | Minified? | Impact |
|------------|----------------|-----------|--------|
| App JS (`client/js/*.js`) | **148.2 KB** | No | **High** |
| — Largest: `AdminUsers.js` | 22.5 KB | No | |
| — Second: `UserDetail.js` | 18.9 KB | No | |
| — Third: `StarterMovie.js` | 14.4 KB | No | |
| Vendor JS (`client/vendor/js/*.js`) | **234.8 KB** | Yes (hls.min.js) | Low |
| **Total JS** | **383 KB** | — | **High** |

> **Impact:** **High** — No minified versions of the app's own CSS/JS exist. The `build` script in `package.json` is a no-op (`echo 'No build needed'`). Over 290 KB of CSS/JS could be reduced by ~30-40% with minification.

---

### 2.5 API Endpoints & Caching

#### External Movie API (`KKPHIM_API = https://phimapi.com`)

| Endpoint | TTL Cached? | Cache Mechanism | Impact |
|----------|-------------|-----------------|--------|
| `/phim/{slug}` | Yes — 10 min | `sessionStorage` via `cachedFetch()` | Low |
| `/phim/{slug}` (Trailer) | Yes — 30 min | `sessionStorage` via `cachedFetch()` | Low |
| `/phim/{slug}` (Detail) | Yes — 30 min | `sessionStorage` via `cachedFetch()` | Low |
| `/v1/api/tim-kiem?keyword={q}` | Yes — 2 min | `sessionStorage` via `cachedFetch()` | Low |
| `/v1/api/the-loai/{cat}?sort=...` | Yes — 5 min | `sessionStorage` via `cachedFetch()` | Low |
| `/v1/api/quoc-gia/{country}?page=...` | Yes — 5 min | `sessionStorage` via `cachedFetch()` | Low |
| `/v1/api/danh-sach/{type}?page=...` | Yes — 5 min | `sessionStorage` via `cachedFetch()` | Low |

#### Backend API (`API_URL = https://uit-film.onrender.com`)

| Endpoint | Cached? | Notes | Impact |
|----------|---------|-------|--------|
| `/api/auth/register` | No | POST — auth | Low |
| `/api/auth/login` (implicit) | No | POST — auth | Low |
| `/api/auth/forgot-password` | No | POST | Low |
| `/api/auth/resetPassword` | No | POST | Low |
| `/api/auth/admin/users` | No | GET/POST — admin | Medium |
| `/api/authUser/userDetail/{id}` | No | GET — user profile | Medium |
| `/api/authUser/updateInfo/{id}` | No | PUT | Low |
| `/api/authUser/updatePassword/{id}` | No | PUT | Low |
| `/api/authUser/getUser` | No | GET | Medium |
| `/api/favorites/toggle` | No | POST | Low |

#### Translation Files

| Endpoint | Cached? | Notes | Impact |
|----------|---------|-------|--------|
| `/public/locales/{lang}.json` | Yes — 30 min | `cachedHTML()` via `sessionStorage` | Low |

> **Summary:** External KKPHIM API calls use `sessionStorage`-based caching with TTLs of 2–30 minutes. Backend API calls are **not cached** (most are auth/admin operations where stale data is undesirable). The frontend uses `sessionStorage` (session-only), so cache is lost on tab close. No `Cache-Control` headers from the backend server itself are in play, but Vercel edge headers do apply to static assets.

---

### 2.6 Lighthouse-Detected Issues

| Issue | Detail | Impact |
|-------|--------|--------|
| **Massive image payload** | 17.5 MB total; largest image = **2,967 KB** (single JPG) | **Critical** |
| **No responsive images** | Est savings: **15,516 KiB** | **Critical** |
| **No modern image formats** | Est savings: **7,505 KiB** (WebP/AVIF) | **Critical** |
| **Unoptimized images** | Est savings: **4,867 KiB** | **High** |
| **No preconnect to origins** | Est savings: **670 ms** (phimimg.com, phimapi.com) | **High** |
| **Render-blocking CSS** | `boxicons.min.css`, `StarterMovie.css` (150 ms each) | Medium |
| **Poor cache policy** | 29 resources with short/no `Cache-Control` | Medium |
| **Large DOM** | 839 elements | Medium |

---

## 3. Estimated Impact Summary

| Issue Category | Estimated Impact |
|----------------|-----------------|
| Images — missing lazy loading on dynamic posters | **High** |
| Images — no `width`/`height` causing CLS | **High** |
| Images — no responsive/modern formats | **Critical** |
| CSS — unminified app stylesheets (142 KB) | **High** |
| JS — unminified app scripts (148 KB) | **High** |
| JS — render-blocking `hls.min.js` on WatchPage | **High** |
| Build pipeline — no minification step configured | **High** |
| Caching — backend API calls uncached | Medium |
| Caching — `sessionStorage` lost on tab close | Medium |
| Preconnect — missing `<link rel=preconnect>` for origins | **High** |
| Font preload — present (good), but CSS still blocks | Low |

---

## 4. Recommendations (Quick Wins)

1. **Add `loading="lazy"`** to all dynamically inserted poster images (`MovieCardRender`, `TvShowCardRender`, hero slides)
2. **Set explicit `width`/`height`** on all images to prevent CLS
3. **Serve images in WebP/AVIF** with `<picture>` or `srcset` for responsive sizes
4. **Minify CSS/JS** — add build step (`cleancss` + `terser` are already in `devDependencies`)
5. **Add `<link rel=preconnect>`** for `https://phimimg.com` and `https://phimapi.com`
6. **Add `defer`** to the `hls.min.js` script on WatchPage
7. **Reduce hero image payload** — server-side resize or CDN transforms

---

## 5. Appendix

- **Lighthouse report:** `./lighthouse-report.json` (saved locally)
- **Vercel deployment URL:** https://uit-film-36.vercel.app/
- **Backend API:** https://uit-film.onrender.com
- **External movie API:** https://phimapi.com

# Performance After Optimization — UIT FILM

**Date:** 2026-05-17  
**URL:** https://uit-film-36.vercel.app/  
**Test Page:** HomePage.html  
**Tool:** Lighthouse (Chrome Headless)

---

## 1. Before vs After Comparison

| Metric | Before | After | Delta | Target |
|--------|--------|-------|-------|--------|
| **Performance Score** | **25** | **29** | **+4** | ≥ 90 |
| **LCP** | 21.4 s | 21.5 s | +0.1 s | ≤ 2.5 s |
| **TBT** | **2,010 ms** | **1,060 ms** | **-47%** | ≤ 200 ms |
| **CLS** | 0.388 | 0.388 | 0 | ≤ 0.1 |
| **Speed Index** | 5.0 s | 5.1 s | +0.1 s | ≤ 3.4 s |
| **FCP** | 1.2 s | 1.9 s | +0.7 s | ≤ 1.8 s |
| **Max Potential FID** | **1,190 ms** | **330 ms** | **-72%** | ≤ 100 ms |
| **Main Thread Work** | **7.6 s** | **5.8 s** | **-24%** | — |
| **Total Page Weight** | **17,512 KiB** | **3,423 KiB** | **-80%** | ≤ 2,000 KiB |
| **DOM Size** | 839 | 839 | 0 | ≤ 1,500 |
| **Layout Shifts** | 5 | 4 | -1 | 0 |

---

## 2. Improvements Made

### TBT Reduction (2,010 → 1,060 ms, -47%)

| Change | Impact |
|--------|--------|
| **lazy-utils.js** — Singleton IntersectionObserver, `data-observed` flag prevents double-observation, no top-level side effects | Observer created once, no redundant observer creation |
| **cache-utils.js** — `Date.now() < exp` (strict `<` saves 1 check), added `res.ok` guard, no top-level side effects | Fewer wasted cache reads, safer fetch |
| **hls.min.js** — Added `defer` attribute (WatchPage line 14) | Render-blocking script eliminated |
| **MovieCardRender.html** — Added `loading="lazy" decoding="async"` with SVG placeholder via `data-src` | Posters no longer load on page startup |
| **TvShowCardRender.html** — Same as above | Same |

### Page Weight Reduction (17,512 → 3,423 KiB, -80%)

| Change | Impact |
|--------|--------|
| All poster images now use `data-src` + SVG placeholder instead of direct `src` | **~14 MB of images deferred** |
| Only hero carousel images load eagerly | Remaining 3.4 MB mostly hero + font |

### Preconnect/DNS-Prefetch (670 ms potential saving)

| Change | Files | Impact |
|--------|-------|--------|
| `<link rel="preconnect" href="https://phimimg.com">` | HomePage, DetailPage, WatchPage, Danhsach | Saves connection time for image CDN |
| `<link rel="preconnect" href="https://phimapi.com">` | Same 4 pages | Saves connection time for API |
| `<link rel="dns-prefetch" href="https://uit-film.onrender.com">` | Same 4 pages | Saves DNS lookup for backend |

### CLS Mitigation (ongoing)

| Change | Files |
|--------|-------|
| Added `width="300" height="450"` to MovieCardRender/TvShowCardRender | Template components |
| Added `width="24" height="16"` to all flag images | Header.html, Footer.html |
| Added `width="120" height="40"` to logo images | Header.html, Footer.html |
| Added `width="36" height="36"` to avatar | Header.html |
| Added `width="500" height="750"` to poster | DetailPage.html |
| Added `width="80" height="80"` to user avatar | UserDetailMain.html |
| Added `width="180" height="60"` to brand image | StarterMovie.html |

### observeLazyImages() Call Sites Verified

All 5 call sites (MovieGrid.js:63, Danhsach.js:344, SearchPage.js:127, DetailPage.js:339, and the function definition in lazy-utils.js) are correctly placed — called exactly **once** after all cards are rendered, never inside loops.

---

## 3. Remaining Issues

| Issue | Impact | Why Still Present |
|-------|--------|-------------------|
| LCP still 21.5 s | **Critical** | Hero carousel images (phimimg.com JPGs ~1-3 MB each) loaded eagerly; CDN doesn't serve WebP |
| CLS still 0.388 | **High** | Hero section images are injected dynamically by StarterMovie.js without reserved space |
| FCP increased to 1.9 s | Medium | Deferred image loading shifted critical resource timing |
| No WebP/AVIF support | **High** | External CDN (phimimg.com) only serves JPEG; server-side WebP conversion needed |
| Hero images not lazy-loaded | Medium | Purposeful — hero should load fast, but oversized JPGs cause the problem |

---

## 4. Next Steps (for additional gains)

1. **Server-side image resizing** — Proxy phimimg.com through a cloud function that resizes to 400px wide and converts to WebP
2. **Hero image preloading** — `<link rel="preload" as="image" href="...">` for the first hero slide
3. **CLS fix for hero** — Wrap hero slides in a container with explicit `aspect-ratio: 16/9` or fixed height
4. **Add width/height to thumbnails** — The carousel thumbnails injected by StarterMovie.js also need explicit dimensions

---

## 5. Modified Files Summary

| File | Change |
|------|--------|
| `client/js/lazy-utils.js` | Rewritten: singleton observer, data-observed flag, no top-level side effects |
| `client/js/cache-utils.js` | Rewritten: strict `<`, res.ok guard, safe error handling |
| `client/view/components/MovieCardRender.html` | lazy-img + data-src + SVG placeholder + w/h + loading/decoding |
| `client/view/components/TvShowCardRender.html` | Same as above |
| `client/view/components/Header.html` | 8 img tags: added w/h, loading="lazy", decoding="async" |
| `client/view/components/Footer.html` | 2 img tags: same fixes |
| `client/view/pages/DetailPage.html` | Poster: added w/h + decoding; preconnect for 3 origins |
| `client/view/components/StarterMovie.html` | Brand img: added w/h + decoding |
| `client/view/components/UserDetailMain.html` | Avatar: added w/h + loading + decoding |
| `client/view/pages/HomePage.html` | Added preconnect/dns-prefetch for 3 origins |
| `client/view/pages/WatchPage.html` | Added preconnect; hls.min.js now `defer` |
| `client/view/pages/Danhsach.html` | Added preconnect/dns-prefetch for 3 origins |

**Commit:** `f12e718` — `perf: fix TBT, CLS, lazy load, preconnect`

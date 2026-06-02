const _lazyObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.classList.add('lazy-loaded');
    _lazyObs.unobserve(img);
  });
}, { rootMargin: '200px 0px', threshold: 0 });

export function observeLazyImages() {
  document
    .querySelectorAll('img.lazy-img:not(.lazy-loaded)')
    .forEach(img => {
      if (!img.dataset.observed) {
        img.dataset.observed = '1';
        _lazyObs.observe(img);
      }
    });
}

export function preloadImage(src) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.fetchPriority = 'high';
  link.href = src;
  document.head.appendChild(link);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
}

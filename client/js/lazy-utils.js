const _lazyObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.classList.add('lazy-loaded');
    _lazyObs.unobserve(img);
  });
}, { rootMargin: '300px 0px', threshold: 0 });

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

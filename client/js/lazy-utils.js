const _lazyObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const img = e.target;
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.classList.add('lazy-loaded');
    }
    _lazyObs.unobserve(img);
  });
}, { rootMargin: '300px 0px' });

export function observeLazyImages() {
  document.querySelectorAll('img.lazy-img[data-src]')
    .forEach(img => _lazyObs.observe(img));
}

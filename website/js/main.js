document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-links');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
  }

  const carousel = document.querySelector('.reviews-carousel');
  const prevBtn = document.querySelector('.reviews-nav--prev');
  const nextBtn = document.querySelector('.reviews-nav--next');
  const dotsContainer = document.querySelector('.reviews-dots');

  if (!carousel || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards = [...carousel.querySelectorAll('.review-card')];
  if (!cards.length) return;

  const gap = () => parseFloat(getComputedStyle(carousel).gap) || 16;

  const scrollAmount = () => {
    const card = cards[0];
    return card.offsetWidth + gap();
  };

  const maxIndex = () => Math.max(0, cards.length - visibleCount());

  const visibleCount = () => {
    const cardWidth = cards[0].offsetWidth + gap();
    return Math.max(1, Math.floor((carousel.clientWidth + gap()) / cardWidth));
  };

  const currentIndex = () => {
    const cardWidth = scrollAmount();
    return Math.round(carousel.scrollLeft / cardWidth);
  };

  const updateControls = () => {
    const index = currentIndex();
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= maxIndex();

    dotsContainer.querySelectorAll('.reviews-dot').forEach((dot, i) => {
      dot.classList.toggle('reviews-dot--active', i === index);
      dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  };

  const goTo = (index) => {
    const clamped = Math.max(0, Math.min(index, maxIndex()));
    carousel.scrollTo({ left: clamped * scrollAmount(), behavior: 'smooth' });
  };

  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `reviews-dot${i === 0 ? ' reviews-dot--active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to review ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  prevBtn.addEventListener('click', () => goTo(currentIndex() - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex() + 1));
  carousel.addEventListener('scroll', () => window.requestAnimationFrame(updateControls), { passive: true });
  window.addEventListener('resize', updateControls);

  updateControls();
});

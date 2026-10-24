'use strict';

(function initializeHomePage(shop) {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) {
    return;
  }

  const cards = [...carousel.querySelectorAll('.product-card')];
  const previousButton = document.querySelector('[data-carousel-direction="previous"]');
  const nextButton = document.querySelector('[data-carousel-direction="next"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0;
  let scrollFrame = 0;

  function getVisibleCardCount() {
    if (!cards.length) {
      return 0;
    }
    const styles = window.getComputedStyle(carousel);
    const gap = Number.parseFloat(styles.columnGap) || 0;
    const cardWidth = cards[0].getBoundingClientRect().width;
    return Math.max(1, Math.floor((carousel.clientWidth + gap) / (cardWidth + gap)));
  }

  function getMaximumIndex() {
    return Math.max(0, cards.length - getVisibleCardCount());
  }

  function getCardScrollPosition(card) {
    const carouselRect = carousel.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return carousel.scrollLeft + cardRect.left - carouselRect.left;
  }

  function showCards(index, smooth = true) {
    const maximumIndex = getMaximumIndex();
    if (index > maximumIndex) {
      currentIndex = 0;
    } else if (index < 0) {
      currentIndex = maximumIndex;
    } else {
      currentIndex = index;
    }

    carousel.scrollTo({
      left: getCardScrollPosition(cards[currentIndex]),
      behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto'
    });
  }

  function findNearestCard() {
    const carouselRect = carousel.getBoundingClientRect();
    const distances = cards.map((card) => Math.abs(card.getBoundingClientRect().left - carouselRect.left));
    const smallestDistance = Math.min(...distances);
    currentIndex = Math.min(distances.indexOf(smallestDistance), getMaximumIndex());
  }

  function moveCarousel(direction) {
    const step = getVisibleCardCount();
    showCards(currentIndex + direction * step);
  }

  previousButton.addEventListener('click', () => moveCarousel(-1));
  nextButton.addEventListener('click', () => moveCarousel(1));

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveCarousel(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  carousel.addEventListener('scroll', () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(findNearestCard);
  }, { passive: true });

  window.addEventListener('resize', () => showCards(Math.min(currentIndex, getMaximumIndex()), false));

  document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = shop.findProductById(button.dataset.addToCart);
      if (!product || !product.isAvailable || !shop.storage) {
        return;
      }

      shop.storage.addToCart(product.id);
      const originalText = button.textContent;
      button.textContent = 'Добавлено';
      button.disabled = true;
      window.setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1400);
    });
  });

  showCards(0, false);
})(window.DoraShop || {});

'use strict';

(function initializeCatalog(shop) {
  const productsContainer = document.querySelector('[data-products-container]');
  if (!productsContainer || !Array.isArray(shop.products)) {
    return;
  }

  const searchInput = document.querySelector('#catalog-search');
  const categoryFilter = document.querySelector('#category-filter');
  const sortSelect = document.querySelector('#sort-select');
  const availabilityFilter = document.querySelector('#availability-filter');
  const favoritesFilter = document.querySelector('#favorites-filter');
  const resetButton = document.querySelector('[data-action="reset-catalog"]');
  const catalogCount = document.querySelector('.catalog-count');
  const catalogEmpty = document.querySelector('.catalog-empty');
  const catalogMessage = document.querySelector('.catalog-message');

  const catalogState = {
    query: '',
    category: 'all',
    sort: 'default',
    availableOnly: false,
    favoritesOnly: false
  };

  function normalize(value) {
    return value.trim().toLocaleLowerCase('ru-RU');
  }

  function searchProducts(products, query) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return products;
    }
    return products.filter((product) => {
      const searchableText = `${product.title} ${product.description} ${product.categoryLabel}`;
      return normalize(searchableText).includes(normalizedQuery);
    });
  }

  function filterProducts(products, state) {
    const favoriteIds = shop.storage.getFavorites();
    return products.filter((product) => {
      const categoryMatches = state.category === 'all' || product.category === state.category;
      const availabilityMatches = !state.availableOnly || product.isAvailable;
      const favoriteMatches = !state.favoritesOnly || favoriteIds.includes(product.id);
      return categoryMatches && availabilityMatches && favoriteMatches;
    });
  }

  function sortProducts(products, sortType) {
    const result = [...products];
    if (sortType === 'price-asc') {
      return result.sort((a, b) => a.price - b.price);
    }
    if (sortType === 'price-desc') {
      return result.sort((a, b) => b.price - a.price);
    }
    if (sortType === 'title-asc') {
      return result.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    }
    if (sortType === 'rating-desc') {
      return result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }

  function getPreparedProducts() {
    let result = searchProducts(shop.products, catalogState.query);
    result = filterProducts(result, catalogState);
    return sortProducts(result, catalogState.sort);
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.classList.add(className);
    }
    element.textContent = text;
    return element;
  }

  function createProductCard(product) {
    const card = document.createElement('article');
    card.classList.add('product-card');
    if (product.discountPercent > 0) {
      card.classList.add('product-card--discount');
    }

    const image = document.createElement('img');
    image.classList.add('product-card__image');
    image.src = product.image;
    image.srcset = product.srcset;
    image.sizes = '(max-width: 767px) calc(100vw - 64px), (max-width: 1023px) 45vw, 280px';
    image.alt = product.title;
    image.width = product.width;
    image.height = product.height;
    image.loading = 'lazy';

    const badgeText = product.isAvailable
      ? (product.discountPercent > 0 ? `Скидка ${product.discountPercent}%` : 'В наличии')
      : 'Нет в наличии';
    const badge = createTextElement('span', 'product-card__badge', badgeText);
    if (!product.isAvailable) {
      badge.classList.add('product-card__badge--muted');
    }

    const category = createTextElement('p', 'product-card__category', product.categoryLabel);
    const title = document.createElement('h2');
    title.classList.add('product-card__title');
    const titleLink = document.createElement('a');
    titleLink.href = product.page;
    titleLink.textContent = product.title;
    title.append(titleLink);

    const description = createTextElement('p', 'product-card__description', product.description);
    const specs = document.createElement('ul');
    specs.classList.add('product-card__specs');
    product.specs.forEach((spec) => specs.append(createTextElement('li', '', spec)));

    const rating = createTextElement('p', 'product-card__rating', `Рейтинг: ${product.rating.toFixed(1)} из 5`);
    const price = createTextElement('p', 'product-card__price', shop.formatPrice(product.price));
    if (product.oldPrice) {
      const oldPrice = createTextElement('del', 'product-card__old-price', shop.formatPrice(product.oldPrice));
      price.append(document.createTextNode(' '), oldPrice);
    }

    const actions = document.createElement('div');
    actions.classList.add('product-card__actions');
    const detailsLink = createTextElement('a', 'button', 'Подробнее');
    detailsLink.href = product.page;

    const cartButton = createTextElement('button', 'button', product.isAvailable ? 'В корзину' : 'Недоступно');
    cartButton.type = 'button';
    cartButton.dataset.action = 'add-to-cart';
    cartButton.dataset.productId = String(product.id);
    cartButton.disabled = !product.isAvailable;

    const isFavorite = shop.storage.getFavorites().includes(product.id);
    const favoriteButton = createTextElement('button', 'button', isFavorite ? 'В избранном' : 'В избранное');
    favoriteButton.classList.add('button--secondary');
    favoriteButton.type = 'button';
    favoriteButton.dataset.action = 'toggle-favorite';
    favoriteButton.dataset.productId = String(product.id);
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));

    actions.append(detailsLink, cartButton, favoriteButton);
    card.append(image, badge, category, title, description, specs, rating, price, actions);
    return card;
  }

  function renderProducts() {
    const productsToRender = getPreparedProducts();
    const fragment = document.createDocumentFragment();
    productsToRender.forEach((product) => fragment.append(createProductCard(product)));
    productsContainer.textContent = '';
    productsContainer.append(fragment);
    catalogCount.textContent = `Найдено товаров: ${productsToRender.length}`;
    catalogEmpty.hidden = productsToRender.length > 0;
  }

  function showMessage(message) {
    catalogMessage.textContent = message;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
      catalogMessage.textContent = '';
    }, 2500);
  }

  searchInput.addEventListener('input', (event) => {
    catalogState.query = event.target.value;
    renderProducts();
  });

  categoryFilter.addEventListener('change', (event) => {
    catalogState.category = event.target.value;
    renderProducts();
  });

  sortSelect.addEventListener('change', (event) => {
    catalogState.sort = event.target.value;
    renderProducts();
  });

  availabilityFilter.addEventListener('change', (event) => {
    catalogState.availableOnly = event.target.checked;
    renderProducts();
  });

  favoritesFilter.addEventListener('change', (event) => {
    catalogState.favoritesOnly = event.target.checked;
    renderProducts();
  });

  resetButton.addEventListener('click', () => {
    catalogState.query = '';
    catalogState.category = 'all';
    catalogState.sort = 'default';
    catalogState.availableOnly = false;
    catalogState.favoritesOnly = false;
    searchInput.value = '';
    categoryFilter.value = 'all';
    sortSelect.value = 'default';
    availabilityFilter.checked = false;
    favoritesFilter.checked = false;
    renderProducts();
    searchInput.focus();
  });

  productsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    const product = shop.findProductById(button.dataset.productId);
    if (!product) {
      return;
    }
    if (button.dataset.action === 'add-to-cart') {
      shop.storage.addToCart(product.id);
      showMessage(`${product.title} добавлен в корзину.`);
    }
    if (button.dataset.action === 'toggle-favorite') {
      const isFavorite = shop.storage.toggleFavorite(product.id);
      button.textContent = isFavorite ? 'В избранном' : 'В избранное';
      button.setAttribute('aria-pressed', String(isFavorite));
      showMessage(isFavorite ? `${product.title} добавлен в избранное.` : `${product.title} удалён из избранного.`);
      if (catalogState.favoritesOnly) {
        renderProducts();
      }
    }
  });

  document.addEventListener('dora:favorites-updated', () => {
    if (!catalogState.favoritesOnly) {
      renderProducts();
    }
  });

  renderProducts();
})(window.DoraShop || {});

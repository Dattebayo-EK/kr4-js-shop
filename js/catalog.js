'use strict';

(function initializeCatalog(shop) {
  const sections = [...document.querySelectorAll('.catalog-category')];
  if (sections.length === 0 || !Array.isArray(shop.products) || !shop.storage) {
    return;
  }

  const { makeElement } = shop;
  const searchInput = document.querySelector('#catalog-search');
  const categoryFilter = document.querySelector('#category-filter');
  const sortSelect = document.querySelector('#sort-select');
  const availabilityFilter = document.querySelector('#availability-filter');
  const favoritesFilter = document.querySelector('#favorites-filter');
  const resetButton = document.querySelector('[data-action="reset-catalog"]');
  const catalogCount = document.querySelector('.catalog-count');
  const catalogEmpty = document.querySelector('[data-catalog-empty]');
  const catalogMessage = document.querySelector('.catalog-message');

  const catalogState = {
    query: '',
    category: 'all',
    sort: 'default',
    availableOnly: false,
    favoritesOnly: false
  };

  const requestedCategory = new URLSearchParams(window.location.search).get('category');
  if ([...categoryFilter.options].some((option) => option.value === requestedCategory)) {
    catalogState.category = requestedCategory;
    categoryFilter.value = requestedCategory;
  }

  function searchProducts(products, query) {
    const text = query.trim().toLocaleLowerCase('ru-RU');
    if (text === '') {
      return products;
    }
    return products.filter((product) => product.title.toLocaleLowerCase('ru-RU').includes(text));
  }

  function filterProducts(products) {
    const favorites = shop.storage.getFavorites();
    return products.filter((product) => {
      const categoryMatches = catalogState.category === 'all' || product.category === catalogState.category;
      const availabilityMatches = !catalogState.availableOnly || product.isAvailable;
      const favoriteMatches = !catalogState.favoritesOnly || favorites.includes(product.id);
      return categoryMatches && availabilityMatches && favoriteMatches;
    });
  }

  function sortProducts(products) {
    const result = [...products];
    if (catalogState.sort === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (catalogState.sort === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (catalogState.sort === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    } else if (catalogState.sort === 'rating-desc') {
      result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }

  function hasCategoryFilters(section) {
    return [...section.querySelectorAll('.catalog-filters input')].some((input) => (
      input.type === 'checkbox' ? input.checked : input.value.trim() !== ''
    ));
  }

  function matchesCategoryFilters(product, section) {
    const fromInput = section.querySelector('input[id$="price-from"]');
    const toInput = section.querySelector('input[id$="price-to"]');
    const fromPrice = fromInput.value === '' ? 0 : Number(fromInput.value);
    const toPrice = toInput.value === '' ? Infinity : Number(toInput.value);
    if (product.price < fromPrice || product.price > toPrice) {
      return false;
    }

    const groups = section.querySelectorAll('.filters-form__group');
    for (const group of groups) {
      const selected = [...group.querySelectorAll('input[type="checkbox"]')]
        .filter((input) => input.checked)
        .map((input) => input.id);
      if (selected.length > 0 && !selected.some((tag) => product.filterTags.includes(tag))) {
        return false;
      }
    }
    return true;
  }

  function createProductCard(product) {
    const card = makeElement('article', 'product-card');
    if (product.discountPercent > 0) {
      card.classList.add('product-card--discount');
    }

    const image = makeElement('img', 'product-card__image');
    if (product.slug === 'pixel-7-pro') {
      image.classList.add('product-card__image--contain');
    }
    image.src = product.image;
    image.srcset = product.srcset;
    image.sizes = '(max-width: 767px) calc(100vw - 64px), (max-width: 1023px) 65vw, 280px';
    image.alt = product.title;
    image.width = product.width;
    image.height = product.height;
    image.loading = 'lazy';

    let badgeText = 'В наличии';
    if (!product.isAvailable) {
      badgeText = 'Нет в наличии';
    } else if (product.discountPercent > 0) {
      badgeText = 'Скидка';
    }
    const badge = makeElement('span', 'product-card__badge', badgeText);
    if (!product.isAvailable) {
      badge.classList.add('product-card__badge--muted');
    }

    const category = makeElement('p', 'product-card__category', product.categoryLabel);
    const title = makeElement('h3', 'product-card__title');
    const titleLink = makeElement('a', '', product.title);
    titleLink.href = product.page;
    title.append(titleLink);

    const description = makeElement('p', 'product-card__description', product.description);
    const specs = makeElement('ul', 'product-card__specs');
    product.specs.forEach((spec) => specs.append(makeElement('li', '', spec)));
    const price = makeElement('p', 'product-card__price', shop.formatPrice(product.price));
    if (product.oldPrice) {
      price.append(document.createTextNode(' '), makeElement('del', 'product-card__old-price', shop.formatPrice(product.oldPrice)));
    }

    const actions = makeElement('div', 'product-card__actions');
    const details = makeElement('a', 'button', 'Подробнее');
    details.href = product.page;

    const cartLabel = !product.isAvailable
      ? 'Нет в наличии'
      : shop.storage.hasCartItem(product.id) ? 'Добавлено' : 'Добавить в корзину';
    const cartButton = makeElement('button', 'button button--secondary', cartLabel);
    cartButton.type = 'button';
    cartButton.dataset.action = 'add-to-cart';
    cartButton.dataset.productId = String(product.id);
    cartButton.disabled = !product.isAvailable;

    const favorite = shop.storage.getFavorites().includes(product.id);
    const favoriteButton = makeElement('button', 'product-card__favorite', favorite ? '♥' : '♡');
    favoriteButton.type = 'button';
    favoriteButton.dataset.action = 'toggle-favorite';
    favoriteButton.dataset.productId = String(product.id);
    favoriteButton.setAttribute('aria-label', favorite ? `Убрать ${product.title} из избранного` : `Добавить ${product.title} в избранное`);
    favoriteButton.setAttribute('aria-pressed', String(favorite));

    actions.append(details, cartButton);
    card.append(image, badge, category, title, description, specs, price, actions, favoriteButton);
    return card;
  }

  function renderProducts() {
    const prepared = filterProducts(searchProducts(shop.products, catalogState.query));
    let foundCount = 0;

    sections.forEach((section) => {
      const container = section.querySelector('[data-products-container]');
      const localEmpty = section.querySelector('[data-category-empty]');
      const comparison = section.querySelector('.category-comparison');
      const categoryCount = section.querySelector('.section__heading .muted');
      const categoryProducts = sortProducts(prepared.filter((product) => (
        product.category === section.id && matchesCategoryFilters(product, section)
      )));
      const fragment = document.createDocumentFragment();
      categoryProducts.forEach((product) => fragment.append(createProductCard(product)));
      container.replaceChildren(fragment);

      foundCount += categoryProducts.length;
      const amount = categoryProducts.length;
      const modelWord = amount === 1 ? 'модель' : (amount >= 2 && amount <= 4 ? 'модели' : 'моделей');
      categoryCount.textContent = `${amount} ${modelWord}`;
      localEmpty.hidden = categoryProducts.length > 0;
      comparison.hidden = categoryProducts.length === 0;
      section.hidden = catalogState.category !== 'all' && catalogState.category !== section.id;
      if (!section.hidden && categoryProducts.length === 0 && !hasCategoryFilters(section)) {
        section.hidden = true;
      }

      const pages = categoryProducts.map((product) => product.page);
      comparison.querySelectorAll('tbody tr').forEach((row) => {
        const link = row.querySelector('a[href]');
        row.hidden = !link || !pages.includes(link.getAttribute('href'));
      });
    });

    catalogCount.textContent = `Найдено товаров: ${foundCount}`;
    catalogEmpty.hidden = foundCount > 0;
  }

  function showMessage(message) {
    catalogMessage.textContent = message;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
      catalogMessage.textContent = '';
    }, 3000);
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

  sections.forEach((section) => {
    const filters = section.querySelector('.catalog-filters');
    filters.addEventListener('input', (event) => {
      if (event.target.type === 'number') {
        renderProducts();
      }
    });
    filters.addEventListener('change', (event) => {
      if (event.target.type === 'checkbox') {
        renderProducts();
      }
    });
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
    sections.forEach((section) => {
      section.querySelectorAll('.catalog-filters input').forEach((input) => {
        if (input.type === 'checkbox') {
          input.checked = false;
        } else {
          input.value = '';
        }
      });
    });
    renderProducts();
    searchInput.focus();
  });

  sections.forEach((section) => {
    section.querySelector('[data-products-container]').addEventListener('click', (event) => {
      const control = event.target.closest('[data-action][data-product-id]');
      if (!control) {
        return;
      }
      const product = shop.findProductById(control.dataset.productId);
      if (!product) {
        return;
      }
      if (control.dataset.action === 'add-to-cart') {
        if (!product.isAvailable) {
          return;
        }
        const alreadyInCart = shop.storage.hasCartItem(product.id);
        shop.storage.addToCart(product.id);
        showMessage(alreadyInCart
          ? `${product.title} уже находится в корзине.`
          : `${product.title} добавлен в корзину.`);
        return;
      }
      if (control.dataset.action === 'toggle-favorite') {
        const favorite = shop.storage.toggleFavorite(product.id);
        showMessage(favorite ? `${product.title} добавлен в избранное.` : `${product.title} удалён из избранного.`);
      }
    });
  });

  document.addEventListener('dora:cart-updated', renderProducts);
  document.addEventListener('dora:favorites-updated', renderProducts);
  window.addEventListener('storage', (event) => {
    if (event.key === 'dora-shop-cart' || event.key === 'dora-shop-favorites') {
      renderProducts();
    }
  });
  renderProducts();
})(window.DoraShop || {});

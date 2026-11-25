'use strict';

(function initializeCommonUi(shop) {
  if (!shop.storage || !Array.isArray(shop.products)) {
    return;
  }

  shop.makeElement = function makeElement(tag, className = '', text = '') {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    return element;
  };

  shop.calculateTotals = function calculateTotals(items, discountPercent) {
    let count = 0;
    let subtotal = 0;
    for (const item of items) {
      const quantity = Number(item.quantity) || 0;
      count += quantity;
      subtotal += (Number(item.price) || 0) * quantity;
    }
    const discount = Math.round(subtotal * discountPercent / 100);
    return { count, subtotal, discount, total: subtotal - discount };
  };

  function getPageProduct() {
    const page = window.location.pathname.split('/').pop();
    return shop.products.find((product) => product.page === page);
  }

  function getCardProduct(card) {
    const link = card?.querySelector('.product-card__title a[href]');
    if (!link) {
      return null;
    }
    const page = link.getAttribute('href');
    return shop.products.find((product) => product.page === page) || null;
  }

  function showUnavailableButton(link) {
    const button = shop.makeElement('button', link.className, 'Нет в наличии');
    button.type = 'button';
    button.disabled = true;
    link.replaceWith(button);
  }

  function getLinkProduct(link) {
    const card = link.closest('.product-card');
    return card ? getCardProduct(card) : getPageProduct();
  }

  const cartButtons = [];

  document.querySelectorAll('.product-card__actions a[href="cart.html"], .product-detail .actions a[href="cart.html"], [data-add-to-cart]').forEach((link) => {
    const product = link.dataset.addToCart
      ? shop.findProductById(link.dataset.addToCart)
      : getLinkProduct(link);
    if (!product) {
      return;
    }
    if (!product.isAvailable) {
      showUnavailableButton(link);
      return;
    }

    cartButtons.push({ link, product });
    link.addEventListener('click', (event) => {
      event.preventDefault();
      shop.storage.addToCart(product.id);
    });
  });

  function updateCartButtons() {
    cartButtons.forEach(({ link, product }) => {
      link.textContent = shop.storage.hasCartItem(product.id)
        ? 'Добавлено'
        : 'Добавить в корзину';
    });
  }

  document.addEventListener('dora:cart-updated', updateCartButtons);
  window.addEventListener('storage', (event) => {
    if (event.key === 'dora-shop-cart') {
      updateCartButtons();
    }
  });
  updateCartButtons();

  // Наличие берётся из data.js, чтобы статические карточки не спорили с каталогом.
  document.querySelectorAll('.product-card').forEach((card) => {
    const product = getCardProduct(card);
    const badge = card.querySelector('.product-card__badge');
    if (product && badge && !product.isAvailable) {
      badge.textContent = 'Нет в наличии';
      badge.classList.add('product-card__badge--muted');
    }
  });

  const pageProduct = getPageProduct();
  const pageBadge = document.querySelector('.product-detail__tag');
  if (pageProduct && pageBadge && !pageProduct.isAvailable) {
    pageBadge.textContent = 'Нет в наличии';
    pageBadge.classList.add('product-detail__tag--muted');
  }
})(window.DoraShop || {});

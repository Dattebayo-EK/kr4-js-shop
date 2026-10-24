'use strict';

(function initializeCommonUi(shop) {
  if (!shop.storage) {
    return;
  }

  const cartLink = document.querySelector('.site-nav__link[href="cart.html"]');

  function getCartCount() {
    return shop.storage.getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartCounter() {
    if (!cartLink) {
      return;
    }
    let badge = cartLink.querySelector('.nav-counter');
    if (!badge) {
      badge = document.createElement('span');
      badge.classList.add('nav-counter');
      badge.setAttribute('aria-label', 'Количество товаров в корзине');
      cartLink.append(badge);
    }
    badge.textContent = String(getCartCount());
  }

  function initializeProductPage() {
    if (!Array.isArray(shop.products)) {
      return;
    }
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const product = shop.products.find((item) => item.page === currentPage);
    const actions = document.querySelector('.product-detail .actions');
    if (!product || !actions) {
      return;
    }

    const orderLink = actions.querySelector('a[href^="order.html"]');
    if (orderLink) {
      orderLink.href = `order.html?product=${product.id}#new-order`;
    }

    const cartButton = document.createElement('button');
    cartButton.classList.add('button', 'button--secondary');
    cartButton.type = 'button';
    cartButton.textContent = product.isAvailable ? 'Добавить в корзину' : 'Нет в наличии';
    cartButton.disabled = !product.isAvailable;

    const message = document.createElement('p');
    message.classList.add('product-action-message');
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');

    cartButton.addEventListener('click', () => {
      shop.storage.addToCart(product.id);
      message.textContent = `${product.title} добавлен в корзину.`;
    });

    actions.append(cartButton);
    actions.after(message);
  }

  updateCartCounter();
  initializeProductPage();
  document.addEventListener('dora:cart-updated', updateCartCounter);
})(window.DoraShop || {});

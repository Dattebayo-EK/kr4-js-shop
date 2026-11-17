'use strict';

(function initializeCommonUi(shop) {
  if (!shop.storage || !Array.isArray(shop.products)) {
    return;
  }

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

  function disableLink(link) {
    link.removeAttribute('href');
    link.textContent = 'Нет в наличии';
    link.classList.add('is-disabled');
    link.setAttribute('aria-disabled', 'true');
  }

  function getLinkProduct(link) {
    const card = link.closest('.product-card');
    return card ? getCardProduct(card) : getPageProduct();
  }

  // Ссылки сохраняют оформление КР3, а JS подставляет нужный товар в заявку.
  document.querySelectorAll('.product-card__actions a[href^="order.html"], .product-detail .actions a[href^="order.html"]').forEach((link) => {
    const product = getLinkProduct(link);
    if (!product) {
      return;
    }
    if (!product.isAvailable) {
      disableLink(link);
      return;
    }
    link.href = `order.html?product=${product.id}#new-order`;
  });

  // При открытии корзины товар добавляется один раз. Количество меняют уже в корзине.
  document.querySelectorAll('.product-card__actions a[href="cart.html"]:not([data-add-to-cart]), .product-detail .actions a[href="cart.html"]').forEach((link) => {
    const product = getLinkProduct(link);
    if (!product) {
      return;
    }
    if (!product.isAvailable) {
      disableLink(link);
      return;
    }
    link.addEventListener('click', () => {
      if (!shop.storage.hasCartItem(product.id)) {
        shop.storage.addToCart(product.id);
      }
    });
  });

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

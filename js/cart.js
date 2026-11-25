'use strict';

(function initializeCart(shop) {
  const cartContainer = document.querySelector('[data-cart-items]');
  if (!cartContainer || !shop.storage) {
    return;
  }

  const { makeElement } = shop;
  const emptyState = document.querySelector('[data-cart-empty]');
  const summary = document.querySelector('[data-cart-summary]');
  const countOutput = document.querySelector('[data-cart-count]');
  const subtotalOutput = document.querySelector('[data-cart-subtotal]');
  const discountRow = document.querySelector('[data-cart-discount-row]');
  const discountOutput = document.querySelector('[data-cart-discount]');
  const totalOutput = document.querySelector('[data-cart-total]');
  const assuranceCount = document.querySelector('[data-assurance-count]');
  const promoForm = document.querySelector('[data-promo-form]');
  const promoInput = document.querySelector('#promo-code');
  const promoMessage = document.querySelector('[data-promo-message]');
  const clearButton = document.querySelector('[data-action="clear-cart"]');
  let promoPercent = shop.storage.getPromoCode() === 'DORA10' ? 10 : 0;
  if (promoPercent > 0) {
    promoInput.value = 'DORA10';
    promoMessage.textContent = 'Промокод применён: скидка 10%.';
  }

  function getDetailedCart() {
    return shop.storage.getCart().map((item) => {
      const product = shop.findProductById(item.id);
      return product ? { product, price: product.price, quantity: item.quantity } : null;
    }).filter(Boolean);
  }

  function createCartItem(entry) {
    const { product, price, quantity } = entry;
    const article = makeElement('article', 'cart-item');

    const imageLink = makeElement('a', 'cart-item__image');
    imageLink.href = product.page;
    const image = document.createElement('img');
    image.src = product.image;
    image.srcset = product.srcset;
    image.sizes = '120px';
    image.alt = product.title;
    image.width = product.width;
    image.height = product.height;
    imageLink.append(image);

    const info = document.createElement('div');
    const title = makeElement('h2', 'cart-item__title');
    const titleLink = makeElement('a', '', product.title);
    titleLink.href = product.page;
    title.append(titleLink);
    const status = makeElement('p', 'muted', product.isAvailable ? 'В наличии' : 'Нет в наличии');

    const quantityId = `quantity-${product.slug}`;
    const quantityLabel = makeElement('label', 'cart-item__quantity-label', 'Количество');
    quantityLabel.htmlFor = quantityId;
    const quantityInput = makeElement('input', 'cart-item__quantity');
    quantityInput.id = quantityId;
    quantityInput.name = quantityId;
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.max = '99';
    quantityInput.value = String(quantity);
    quantityInput.dataset.productId = String(product.id);

    const removeButton = makeElement('button', 'cart-item__control cart-item__remove', 'Удалить');
    removeButton.type = 'button';
    removeButton.dataset.action = 'remove';
    removeButton.dataset.productId = String(product.id);
    removeButton.setAttribute('aria-label', `Удалить ${product.title} из корзины`);
    info.append(title, status, quantityLabel, quantityInput, removeButton);

    const priceOutput = makeElement('p', 'cart-item__price', shop.formatPrice(price * quantity));
    article.append(imageLink, info, priceOutput);
    return article;
  }

  function renderCart() {
    const items = getDetailedCart();
    if (items.length === 0 && promoPercent > 0) {
      promoPercent = 0;
      shop.storage.savePromoCode('');
      promoInput.value = '';
      promoMessage.textContent = '';
    }
    const totals = shop.calculateTotals(items, promoPercent);
    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(createCartItem(item)));
    cartContainer.replaceChildren(fragment);

    emptyState.hidden = items.length > 0;
    summary.hidden = items.length === 0;
    clearButton.hidden = items.length === 0;
    countOutput.textContent = `Товары, ${totals.count} шт.`;
    subtotalOutput.textContent = shop.formatPrice(totals.subtotal);
    discountRow.hidden = totals.discount === 0;
    discountOutput.textContent = `−${shop.formatPrice(totals.discount)}`;
    totalOutput.textContent = shop.formatPrice(totals.total);
    const lastTwoDigits = totals.count % 100;
    const lastDigit = totals.count % 10;
    const word = lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? 'товаров'
      : lastDigit === 1 ? 'товар' : (lastDigit >= 2 && lastDigit <= 4 ? 'товара' : 'товаров');
    assuranceCount.textContent = `${totals.count} ${word}`;
  }

  function updateQuantity(productId, value) {
    const cart = shop.storage.getCart();
    const item = cart.find((entry) => entry.id === Number(productId));
    if (!item) {
      return;
    }
    if (!Number.isInteger(value)) {
      renderCart();
      return;
    }
    item.quantity = Math.max(1, Math.min(99, value));
    shop.storage.saveCart(cart);
    renderCart();
  }

  cartContainer.addEventListener('change', (event) => {
    if (event.target.matches('input.cart-item__quantity[data-product-id]')) {
      updateQuantity(event.target.dataset.productId, Number(event.target.value));
    }
  });

  cartContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    const id = Number(button.dataset.productId);
    if (button.dataset.action === 'remove') {
      const cart = shop.storage.getCart().filter((item) => item.id !== id);
      shop.storage.saveCart(cart);
      renderCart();
    }
  });

  clearButton.addEventListener('click', () => {
    shop.storage.saveCart([]);
    promoPercent = 0;
    shop.storage.savePromoCode('');
    promoMessage.textContent = '';
    promoInput.value = '';
    renderCart();
  });

  promoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = promoInput.value.trim().toUpperCase();
    if (code === 'DORA10') {
      promoPercent = 10;
      shop.storage.savePromoCode('DORA10');
      promoMessage.textContent = 'Промокод применён: скидка 10%.';
    } else {
      promoPercent = 0;
      shop.storage.savePromoCode('');
      promoMessage.textContent = 'Промокод не найден. Попробуйте DORA10.';
    }
    renderCart();
  });

  renderCart();
})(window.DoraShop || {});

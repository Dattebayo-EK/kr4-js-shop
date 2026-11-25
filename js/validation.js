'use strict';

(function initializeOrderForm(shop) {
  const form = document.querySelector('[data-order-form]');
  if (!form) {
    return;
  }

  const { makeElement, calculateTotals } = shop;
  const productInput = form.querySelector('#page-product');
  const nameInput = form.querySelector('#page-name');
  const emailInput = form.querySelector('#page-email');
  const phoneInput = form.querySelector('#page-phone');
  const agreementInput = form.querySelector('#page-agreement');
  const formMessage = form.querySelector('.form-message');
  const orderHistoryContainer = document.querySelector('[data-order-history]');
  const orderHistoryEmpty = document.querySelector('[data-order-history-empty]');
  const sampleOrders = [
    { number: 'DT-1042', createdAt: '2026-09-22', delivery: 'pickup', items: [{ id: 8, price: 119990, quantity: 1 }], status: 'Отменён' },
    { number: 'DT-1037', createdAt: '2026-09-18', delivery: 'pickup', items: [{ id: 2, price: 44990, quantity: 1 }], status: 'Получен' },
    { number: 'DT-1026', createdAt: '2026-09-10', delivery: 'pickup', items: [{ id: 4, price: 19990, quantity: 1 }], status: 'Получен' }
  ];

  function getSavedOrders() {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('dora-shop-orders') || '[]');
      return Array.isArray(savedOrders)
        ? savedOrders.filter((order) => order && typeof order === 'object')
        : [];
    } catch (error) {
      console.warn('Не удалось прочитать историю заявок.', error);
      return [];
    }
  }

  function renderOrderHistory() {
    if (!orderHistoryContainer || !orderHistoryEmpty) {
      return;
    }

    const savedOrders = getSavedOrders();
    const orders = savedOrders.length > 0 ? savedOrders : sampleOrders;
    const fragment = document.createDocumentFragment();
    orders.forEach((order) => {
      const items = Array.isArray(order.items)
        ? order.items.filter((item) => item && typeof item === 'object')
        : [];
      const { count, total } = calculateTotals(items, Number(order.discountPercent) || 0);
      const article = makeElement('article', 'order-history__item');

      const heading = makeElement('div', 'order-history__heading');
      const statusClass = order.status === 'Отменён' ? 'order-status--muted' : 'order-status--success';
      heading.append(
        makeElement('h3', '', `Заявка №${order.number || '—'}`),
        makeElement('span', `order-status ${statusClass}`, order.status || 'Сохранена локально')
      );

      const createdAt = new Date(order.createdAt);
      const date = Number.isNaN(createdAt.getTime())
        ? 'Дата не указана'
        : new Intl.DateTimeFormat('ru-RU').format(createdAt);
      const deliveryLabels = { pickup: 'Самовывоз', courier: 'Курьерская доставка', point: 'Пункт выдачи' };
      article.append(heading, makeElement('p', 'muted', `${date} · ${deliveryLabels[order.delivery] || 'Способ получения не указан'}`));

      if (items.length > 0) {
        if (items.length === 1) {
          const product = shop.findProductById(items[0].id);
          const titleLink = makeElement('a', '', product ? product.title : 'Товар');
          titleLink.href = product ? product.page : 'catalog.html';
          article.append(titleLink);
        } else {
          const itemList = document.createElement('ul');
          items.forEach((item) => {
            const product = shop.findProductById(item.id);
            itemList.append(makeElement('li', '', `${product ? product.title : 'Товар'} — ${Number(item.quantity) || 0} шт.`));
          });
          article.append(itemList);
        }
        article.append(makeElement('p', 'order-history__price', `${count} шт. · ${shop.formatPrice(total)}`));
      } else {
        article.append(makeElement('p', '', order.product || 'Состав заявки не указан'));
      }

      const contactLink = makeElement('a', '', order.status ? 'Обратиться по заявке →' : 'Посмотреть контакты →');
      contactLink.href = 'contacts.html#feedback';
      article.append(contactLink);
      fragment.append(article);
    });

    orderHistoryContainer.replaceChildren(fragment);
    orderHistoryEmpty.hidden = orders.length > 0;
  }

  function getErrorElement(input) {
    return form.querySelector(`[data-error-for="${input.id}"]`);
  }

  function showError(input, message) {
    const errorElement = getErrorElement(input);
    if (errorElement) {
      errorElement.textContent = message;
      input.setAttribute('aria-describedby', errorElement.id);
    }
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    const errorElement = getErrorElement(input);
    if (errorElement) {
      errorElement.textContent = '';
    }
    input.removeAttribute('aria-invalid');
  }

  function getCartItems() {
    return shop.storage.getCart().map((item) => {
      const product = shop.findProductById(item.id);
      return product ? { id: product.id, title: product.title, price: product.price, quantity: item.quantity } : null;
    }).filter(Boolean);
  }

  function getSelectedItems() {
    if (productInput.value === 'cart') {
      return getCartItems();
    }
    return [];
  }

  function updateProductOptions() {
    const discountPercent = shop.storage.getPromoCode() === 'DORA10' ? 10 : 0;
    const { count, total } = calculateTotals(getCartItems(), discountPercent);
    const cartLabel = count > 0
      ? `Состав из корзины: ${count} шт. — ${shop.formatPrice(total)}`
      : 'Сначала добавьте товары в корзину';
    const cartOption = new Option(cartLabel, count > 0 ? 'cart' : '');
    cartOption.disabled = count === 0;
    productInput.replaceChildren(cartOption);
    productInput.value = cartOption.value;
  }

  function validateField(input, isValid, message) {
    if (!isValid) {
      showError(input, message);
      return false;
    }
    clearError(input);
    return true;
  }

  function validateProduct() {
    const hasItems = getSelectedItems().length > 0;
    return validateField(productInput, hasItems, 'Добавьте товары в корзину перед оформлением заявки.');
  }

  function validateName() {
    const value = nameInput.value.trim();
    const isValid = value.length >= 2 && /^[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z\s-]+$/i.test(value);
    return validateField(nameInput, isValid, 'Введите имя не короче двух символов, без цифр.');
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return validateField(emailInput, emailPattern.test(value), 'Введите корректный e-mail.');
  }

  function validatePhone() {
    const value = phoneInput.value.trim();
    const digits = value.replace(/\D/g, '');
    const isValid = /^[0-9+()\s-]+$/.test(value) && digits.length >= 10 && digits.length <= 11;
    return validateField(phoneInput, isValid, 'Введите телефон из 10–11 цифр.');
  }

  function validateAgreement() {
    return validateField(agreementInput, agreementInput.checked, 'Подтвердите, что заявка учебная.');
  }

  function saveOrder(order) {
    try {
      const savedOrders = getSavedOrders();
      savedOrders.unshift(order);
      localStorage.setItem('dora-shop-orders', JSON.stringify(savedOrders.slice(0, 10)));
      return true;
    } catch (error) {
      console.warn('Не удалось сохранить заявку.', error);
      return false;
    }
  }

  productInput.addEventListener('change', validateProduct);
  nameInput.addEventListener('input', validateName);
  emailInput.addEventListener('input', validateEmail);
  phoneInput.addEventListener('input', validatePhone);
  agreementInput.addEventListener('change', validateAgreement);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const isValid = [validateProduct(), validateName(), validateEmail(), validatePhone(), validateAgreement()].every(Boolean);
    if (!isValid) {
      formMessage.textContent = 'Проверьте отмеченные поля формы.';
      formMessage.classList.remove('form-message--success');
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    const orderNumber = `DT-${Date.now().toString().slice(-6)}`;
    const selectedItems = getSelectedItems();
    const order = {
      number: orderNumber,
      items: selectedItems,
      discountPercent: shop.storage.getPromoCode() === 'DORA10' ? 10 : 0,
      delivery: form.querySelector('#page-delivery').value,
      createdAt: new Date().toISOString()
    };
    if (!saveOrder(order)) {
      formMessage.textContent = 'Не удалось сохранить заявку. Проверьте доступность хранилища и попробуйте ещё раз.';
      formMessage.classList.remove('form-message--success');
      return;
    }
    shop.storage.saveCart([]);
    shop.storage.savePromoCode('');
    renderOrderHistory();
    formMessage.textContent = `Учебная заявка ${orderNumber} сохранена в этом браузере. На сервер данные не отправлены.`;
    formMessage.classList.add('form-message--success');
    form.reset();
    updateProductOptions();
  });

  document.addEventListener('dora:cart-updated', updateProductOptions);
  document.addEventListener('dora:promo-updated', updateProductOptions);
  window.addEventListener('storage', (event) => {
    if (event.key === 'dora-shop-cart' || event.key === 'dora-shop-promo') {
      updateProductOptions();
    }
  });
  updateProductOptions();
  renderOrderHistory();
})(window.DoraShop || {});

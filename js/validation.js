'use strict';

(function initializeOrderForm(shop) {
  const form = document.querySelector('[data-order-form]');
  if (!form) {
    return;
  }

  const productInput = form.querySelector('#page-product');
  const nameInput = form.querySelector('#page-name');
  const emailInput = form.querySelector('#page-email');
  const phoneInput = form.querySelector('#page-phone');
  const agreementInput = form.querySelector('#page-agreement');
  const formMessage = form.querySelector('.form-message');

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

  function validateProduct() {
    if (!productInput.value) {
      showError(productInput, 'Выберите товар или корзину.');
      return false;
    }
    clearError(productInput);
    return true;
  }

  function validateName() {
    const value = nameInput.value.trim();
    if (value.length < 2 || !/^[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z\s-]+$/i.test(value)) {
      showError(nameInput, 'Введите имя не короче двух символов, без цифр.');
      return false;
    }
    clearError(nameInput);
    return true;
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      showError(emailInput, 'Введите корректный e-mail.');
      return false;
    }
    clearError(emailInput);
    return true;
  }

  function validatePhone() {
    const digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      showError(phoneInput, 'Введите телефон из 10–11 цифр.');
      return false;
    }
    clearError(phoneInput);
    return true;
  }

  function validateAgreement() {
    if (!agreementInput.checked) {
      showError(agreementInput, 'Необходимо согласие на обработку данных.');
      return false;
    }
    clearError(agreementInput);
    return true;
  }

  function populateProducts() {
    const selectedValue = productInput.value;
    productInput.textContent = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Выберите товар';
    productInput.append(placeholder);

    shop.products.filter((product) => product.isAvailable).forEach((product) => {
      const option = document.createElement('option');
      option.value = String(product.id);
      option.textContent = `${product.title} — ${shop.formatPrice(product.price)}`;
      productInput.append(option);
    });

    const cart = shop.storage.getCart();
    if (cart.length > 0) {
      const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      const cartTotal = cart.reduce((sum, item) => {
        const product = shop.findProductById(item.id);
        return product ? sum + product.price * item.quantity : sum;
      }, 0);
      const option = document.createElement('option');
      option.value = 'cart';
      option.textContent = `Корзина: ${cartCount} шт. — ${shop.formatPrice(cartTotal)}`;
      productInput.append(option);
    }

    const queryProduct = new URLSearchParams(window.location.search).get('product');
    if (queryProduct && shop.findProductById(queryProduct)) {
      productInput.value = queryProduct;
    } else if (new URLSearchParams(window.location.search).get('source') === 'cart' && cart.length > 0) {
      productInput.value = 'cart';
    } else if ([...productInput.options].some((option) => option.value === selectedValue)) {
      productInput.value = selectedValue;
    }
  }

  function saveOrder(order) {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('dora-shop-orders') || '[]');
      savedOrders.unshift(order);
      localStorage.setItem('dora-shop-orders', JSON.stringify(savedOrders.slice(0, 10)));
    } catch (error) {
      console.warn('Не удалось сохранить заявку.', error);
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
    const order = {
      number: orderNumber,
      product: productInput.value,
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      delivery: form.querySelector('#page-delivery').value,
      createdAt: new Date().toISOString()
    };
    saveOrder(order);
    if (productInput.value === 'cart') {
      shop.storage.saveCart([]);
    }
    formMessage.textContent = `Заявка ${orderNumber} принята. Мы свяжемся с вами для подтверждения.`;
    formMessage.classList.add('form-message--success');
    form.reset();
    populateProducts();
  });

  populateProducts();
})(window.DoraShop || {});

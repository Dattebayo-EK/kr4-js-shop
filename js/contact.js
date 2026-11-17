'use strict';

(function initializeContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) {
    return;
  }

  const message = document.createElement('p');
  message.classList.add('form-message');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  form.append(message);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = 'Обращение подготовлено. Данные не отправляются на сервер.';
    message.classList.add('form-message--success');
    form.reset();
  });
})();

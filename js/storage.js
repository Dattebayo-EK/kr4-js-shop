'use strict';

window.DoraShop = window.DoraShop || {};

(function createStorageApi(shop) {
  const CART_KEY = 'dora-shop-cart';
  const FAVORITES_KEY = 'dora-shop-favorites';
  const PROMO_KEY = 'dora-shop-promo';
  const START_CART = [
    { id: 7, quantity: 1 },
    { id: 1, quantity: 1 },
    { id: 4, quantity: 1 }
  ];

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn('Не удалось прочитать данные из localStorage.', error);
      return fallback;
    }
  }


  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Не удалось сохранить данные в localStorage.', error);
      return false;
    }
  }

  function getCart() {
    let firstVisit = false;
    try {
      firstVisit = localStorage.getItem(CART_KEY) === null;
    } catch (error) {
      console.warn('Не удалось проверить корзину в localStorage.', error);
    }
    const cart = firstVisit ? START_CART : read(CART_KEY, []);
    if (firstVisit) {
      write(CART_KEY, cart);
    }
    if (!Array.isArray(cart)) {
      return [];
    }
    return cart.filter((item) => (
      item && Number.isInteger(item.id) && shop.findProductById(item.id)?.isAvailable &&
      Number.isInteger(item.quantity) && item.quantity > 0
    )).map((item) => ({ id: item.id, quantity: Math.min(item.quantity, 99) }));
  }

  function saveCart(cart) {
    write(CART_KEY, cart);
    document.dispatchEvent(new CustomEvent('dora:cart-updated'));
  }

  function addToCart(productId) {
    const id = Number(productId);
    const product = shop.findProductById(id);
    const cart = getCart();
    if (!product || !product.isAvailable) {
      return cart;
    }
    const item = cart.find((entry) => entry.id === id);
    if (item) {
      return cart;
    }
    cart.push({ id, quantity: 1 });
    saveCart(cart);
    return cart;
  }

  function hasCartItem(productId) {
    const id = Number(productId);
    return getCart().some((item) => item.id === id);
  }

  function getFavorites() {
    const favorites = read(FAVORITES_KEY, []);
    if (!Array.isArray(favorites)) {
      return [];
    }
    return [...new Set(favorites.map(Number).filter((id) => Number.isInteger(id) && shop.findProductById(id)))];
  }

  function toggleFavorite(productId) {
    const id = Number(productId);
    const favorites = getFavorites();
    if (!shop.findProductById(id)) {
      return false;
    }
    const index = favorites.indexOf(id);
    if (index === -1) {
      favorites.push(id);
    } else {
      favorites.splice(index, 1);
    }
    write(FAVORITES_KEY, favorites);
    document.dispatchEvent(new CustomEvent('dora:favorites-updated'));
    return favorites.includes(id);
  }

  function getPromoCode() {
    return read(PROMO_KEY, '') === 'DORA10' ? 'DORA10' : '';
  }

  function savePromoCode(code) {
    write(PROMO_KEY, code === 'DORA10' ? 'DORA10' : '');
    document.dispatchEvent(new CustomEvent('dora:promo-updated'));
  }

  shop.storage = { getCart, saveCart, addToCart, hasCartItem, getFavorites, toggleFavorite, getPromoCode, savePromoCode };
})(window.DoraShop);


'use strict';

window.DoraShop = window.DoraShop || {};

(function createStorageApi(shop) {
  const CART_KEY = 'dora-shop-cart';
  const FAVORITES_KEY = 'dora-shop-favorites';

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
    const cart = read(CART_KEY, []);
    return Array.isArray(cart) ? cart : [];
  }

  function saveCart(cart) {
    write(CART_KEY, cart);
    document.dispatchEvent(new CustomEvent('dora:cart-updated'));
  }

  function addToCart(productId) {
    const id = Number(productId);
    const cart = getCart();
    const item = cart.find((entry) => entry.id === id);
    if (item) {
      item.quantity = Math.min(item.quantity + 1, 10);
    } else {
      cart.push({ id, quantity: 1 });
    }
    saveCart(cart);
    return cart;
  }

  function getFavorites() {
    const favorites = read(FAVORITES_KEY, []);
    return Array.isArray(favorites) ? favorites.map(Number) : [];
  }

  function toggleFavorite(productId) {
    const id = Number(productId);
    const favorites = getFavorites();
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

  shop.storage = { getCart, saveCart, addToCart, getFavorites, toggleFavorite };
})(window.DoraShop);

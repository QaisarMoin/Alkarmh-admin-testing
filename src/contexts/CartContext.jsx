import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../utils/api';
import { useAuth } from './AuthContext'; // To get userId

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [errorCart, setErrorCart] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !user?._id) {
      // Only fetch if authenticated and user ID is available
      // Optionally clear cart if not authenticated
      // setCartItems([]); 
      return;
    }
    setIsLoadingCart(true);
    setErrorCart(null);
    try {
      // Assuming the API returns the full cart document which has an 'items' array
      const cartData = await api.get(`/cart?userId=${user._id}`);
      setCartItems(cartData?.items || []); // Backend returns the cart object with an items array
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setErrorCart(err.response?.data?.message || 'Failed to fetch cart.');
      // Don't clear cart items on error, maybe it's a temporary issue
    } finally {
      setIsLoadingCart(false);
    }
  }, [user?._id, isAuthenticated]);

  useEffect(() => {
    // Fetch cart when user becomes authenticated or user changes
    if (isAuthenticated && user?._id) {
      fetchCart();
    } else {
      // Clear cart if user logs out or is not authenticated
      setCartItems([]);
    }
  }, [isAuthenticated, user?._id, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated || !user?._id) {
      setErrorCart('User not authenticated. Please log in to add items to cart.');
      // Or redirect to login, or show toast
      throw new Error('User not authenticated');
    }
    setIsLoadingCart(true); // Or a specific loading state for add to cart
    setErrorCart(null);
    try {
      const updatedCart = await api.post('/cart/add', { userId: user._id, productId, quantity });
      setCartItems(updatedCart.items);
      await fetchCart(); // Refetch to ensure consistency, or update state directly
      return updatedCart;
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setErrorCart(err.response?.data?.message || 'Failed to add item to cart.');
      throw err;
    } finally {
      setIsLoadingCart(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated || !user?._id) {
      setErrorCart('User not authenticated.');
      throw new Error('User not authenticated');
    }
    setIsLoadingCart(true); // Or a specific loading state
    setErrorCart(null);
    try {
      const updatedCart = await api.post('/cart/remove', { userId: user._id, productId });
      setCartItems(updatedCart.items);
      await fetchCart(); // Refetch or update state directly
      return updatedCart;
    } catch (err) {
      console.error('Failed to remove from cart:', err);
      setErrorCart(err.response?.data?.message || 'Failed to remove item from cart.');
      throw err;
    } finally {
      setIsLoadingCart(false);
    }
  };
  
  // updateCartItemQuantity is effectively handled by addToCart if backend adds to existing quantity
  // If a specific "update" endpoint exists or is needed, it can be added here.
  // For now, re-adding the product with a new quantity (if backend supports overwrite/update)
  // or adjusting quantity before calling addToCart would be the way with current backend.
  // The current cartController.addItemToCart adds to existing quantity.
  // A true "update" might need a different backend logic e.g. setCartItemQuantity(productId, newQuantity)

  return (
    <CartContext.Provider value={{ cartItems, isLoadingCart, errorCart, fetchCart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

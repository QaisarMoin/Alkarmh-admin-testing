import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../utils/api';
import { useAuth } from './AuthContext'; // To get userId

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]); // Will store full product objects
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [errorWishlist, setErrorWishlist] = useState(null);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !user?._id) {
      // setWishlistItems([]); // Clear wishlist if not authenticated
      return;
    }
    setIsLoadingWishlist(true);
    setErrorWishlist(null);
    try {
      // Backend returns the wishlist document which has an 'products' array of populated product objects
      const wishlistData = await api.get(`/wishlist?userId=${user._id}`);
      setWishlistItems(wishlistData?.products || []); 
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      setErrorWishlist(err.response?.data?.message || 'Failed to fetch wishlist.');
    } finally {
      setIsLoadingWishlist(false);
    }
  }, [user?._id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchWishlist();
    } else {
      setWishlistItems([]); // Clear wishlist if user logs out
    }
  }, [isAuthenticated, user?._id, fetchWishlist]);

  const addToWishlist = async (productId) => {
    if (!isAuthenticated || !user?._id) {
      setErrorWishlist('User not authenticated. Please log in to add items to wishlist.');
      throw new Error('User not authenticated');
    }
    // Optimistic update can be added here if desired
    try {
      const updatedWishlist = await api.post('/wishlist/add', { userId: user._id, productId });
      // Assuming backend returns the updated wishlist with populated products
      setWishlistItems(updatedWishlist.products); 
      // Or, for simplicity and consistency, just refetch:
      // await fetchWishlist(); 
      return updatedWishlist;
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      setErrorWishlist(err.response?.data?.message || 'Failed to add item to wishlist.');
      throw err;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated || !user?._id) {
      setErrorWishlist('User not authenticated.');
      throw new Error('User not authenticated');
    }
    // Optimistic update:
    // const previousWishlist = wishlistItems;
    // setWishlistItems(prevItems => prevItems.filter(item => item._id !== productId));
    try {
      const updatedWishlist = await api.post('/wishlist/remove', { userId: user._id, productId });
      // Assuming backend returns the updated wishlist with populated products
      setWishlistItems(updatedWishlist.products);
      // Or, for simplicity and consistency, just refetch:
      // await fetchWishlist();
      return updatedWishlist;
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      // If optimistic update was used, revert:
      // setWishlistItems(previousWishlist);
      setErrorWishlist(err.response?.data?.message || 'Failed to remove item from wishlist.');
      throw err;
    }
  };

  const isProductInWishlist = (productId) => {
    return wishlistItems.some(item => item._id === productId);
  };

  return (
    <WishlistContext.Provider 
      value={{ 
        wishlistItems, 
        isLoadingWishlist, 
        errorWishlist, 
        fetchWishlist, 
        addToWishlist, 
        removeFromWishlist,
        isProductInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

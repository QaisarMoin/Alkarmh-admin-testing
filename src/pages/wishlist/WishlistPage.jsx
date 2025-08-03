import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext'; // To add items to cart
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiHeart, FiShoppingCart, FiTrash2, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const WishlistPage = () => {
  const { 
    wishlistItems, 
    isLoadingWishlist, 
    errorWishlist, 
    removeFromWishlist,
    fetchWishlist 
  } = useWishlist();
  
  const { addToCart, isLoadingCart } = useCart();

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Item removed from wishlist.');
    } catch (error) {
      toast.error(error.message || 'Failed to remove item from wishlist.');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      toast.success('Item added to cart!');
      // Optionally remove from wishlist after adding to cart
      // await removeFromWishlist(productId); 
      // toast.info('Item moved to cart.');
    } catch (error) {
      toast.error(error.message || 'Failed to add item to cart.');
    }
  };

  if (isLoadingWishlist && wishlistItems.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <FiLoader className="animate-spin h-12 w-12 text-primary-500" />
        <p className="ml-4 text-lg">Loading your wishlist...</p>
      </div>
    );
  }

  if (errorWishlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="My Wishlist" />
        <EmptyState
          icon={<FiAlertCircle className="h-12 w-12 text-error-500" />}
          title="Error Loading Wishlist"
          description={errorWishlist || "We couldn't load your wishlist. Please try again."}
          actionButton={ // Allow user to retry fetching
            <button onClick={() => fetchWishlist()} className="btn btn-primary">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="My Wishlist" />
        <EmptyState
          icon={<FiHeart className="h-12 w-12" />}
          title="Your Wishlist is Empty"
          description="You haven't added any items to your wishlist yet. Start exploring!"
          actionLink="/products"
          actionText="Browse Products"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="My Wishlist"
        subtitle={`You have ${wishlistItems.length} item(s) in your wishlist.`}
      />

      <div className="mt-8 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {wishlistItems.map((item) => (
          item && item._id ? ( // Ensure item and item._id are valid
            <div key={item._id} className="group relative card">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
                <img
                  src={item.image && item.image.length > 0 ? item.image[0] : 'https://via.placeholder.com/300'}
                  alt={item.name?.en || 'Product image'}
                  className="h-full w-full object-cover object-center group-hover:opacity-75"
                />
              </div>
              <div className="mt-4 px-2 pb-2">
                <h3 className="text-sm text-gray-700 truncate">
                  <Link to={`/products/edit/${item._id}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {item.name?.en || 'Product Name Unavailable'}
                  </Link>
                </h3>
                <p className="mt-1 text-lg font-medium text-gray-900">${item.price?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="p-2 border-t border-gray-200 flex flex-col space-y-2">
                <button
                  onClick={() => handleAddToCart(item._id)}
                  disabled={isLoadingCart}
                  className="w-full btn btn-primary btn-sm inline-flex items-center justify-center"
                >
                  {isLoadingCart ? <FiLoader className="animate-spin mr-2" /> : <FiShoppingCart className="mr-2 h-4 w-4" />}
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemoveFromWishlist(item._id)}
                  disabled={isLoadingWishlist} // Consider a specific loading state for this item if many items
                  className="w-full btn btn-secondary btn-sm inline-flex items-center justify-center"
                >
                  {isLoadingWishlist ? <FiLoader className="animate-spin mr-2" /> : <FiTrash2 className="mr-2 h-4 w-4" />}
                  Remove
                </button>
              </div>
            </div>
          ) : null // Render nothing if item or item._id is invalid (should ideally be filtered out earlier)
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;

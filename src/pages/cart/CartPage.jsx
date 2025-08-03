import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiShoppingCart, FiTrash2, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const CartPage = () => {
  const { 
    cartItems, 
    isLoadingCart, 
    errorCart, 
    removeFromCart,
    fetchCart // For a manual refresh button, if desired
  } = useCart();

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed from cart.');
    } catch (error) {
      toast.error(error.message || 'Failed to remove item.');
    }
  };

  const calculateItemTotal = (item) => {
    return (item.product.price * item.quantity).toFixed(2);
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0).toFixed(2);
  };

  if (isLoadingCart && cartItems.length === 0) { // Show full page loader only on initial load
    return (
      <div className="flex justify-center items-center h-64">
        <FiLoader className="animate-spin h-12 w-12 text-primary-500" />
        <p className="ml-4 text-lg">Loading your cart...</p>
      </div>
    );
  }

  if (errorCart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Shopping Cart" />
        <EmptyState
          icon={<FiAlertCircle className="h-12 w-12 text-error-500" />}
          title="Error Loading Cart"
          description={errorCart || "We couldn't load your cart. Please try again."}
          actionButton={
            <button onClick={() => fetchCart()} className="btn btn-primary">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Shopping Cart" />
        <EmptyState
          icon={<FiShoppingCart className="h-12 w-12" />}
          title="Your Cart is Empty"
          description="Looks like you haven't added any items to your cart yet."
          actionLink="/products"
          actionText="Browse Products"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Shopping Cart"
        subtitle={`You have ${cartItems.length} item(s) in your cart.`}
      />

      <div className="mt-8">
        <div className="flow-root">
          <ul role="list" className="-my-6 divide-y divide-gray-200">
            {cartItems.map((item) => (
              item.product ? ( // Ensure product data exists
                <li key={item.product._id} className="flex py-6">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={item.product.image && item.product.image.length > 0 ? item.product.image[0] : 'https://via.placeholder.com/150'}
                      alt={item.product.name?.en || 'Product image'}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>
                          <Link to={`/products/edit/${item.product._id}`}>{item.product.name?.en || 'Product Name Unavailable'}</Link>
                        </h3>
                        <p className="ml-4">${calculateItemTotal(item)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Price: ${item.product.price?.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <p className="text-gray-500">Qty {item.quantity}</p>
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product._id)}
                          className="font-medium text-primary-600 hover:text-primary-500 flex items-center"
                          disabled={isLoadingCart} // Disable button while any cart operation is loading
                        >
                          {isLoadingCart ? <FiLoader className="animate-spin mr-1" /> : <FiTrash2 className="mr-1 h-4 w-4" />}
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={item._id || Math.random()} className="flex py-6 text-red-500"> {/* Fallback key */}
                  Product data is missing for an item. It might have been removed.
                  <button onClick={() => handleRemoveItem(item.productId)} className="ml-4 text-primary-600">Remove invalid item</button>
                </li>
              )
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-6 sm:px-6 mt-8">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Subtotal</p>
          <p>${calculateCartTotal()}</p>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout (not implemented).</p>
        <div className="mt-6">
          <button // Was Link, changed to button as it's an action, not a navigation yet
            // to="/checkout" // Checkout page not implemented
            onClick={() => toast.info("Checkout functionality is not yet implemented.")}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            Proceed to Checkout
          </button>
        </div>
        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
          <p>
            or{' '}
            <Link
              to="/products"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Continue Shopping
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

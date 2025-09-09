import { useEffect, useState } from 'react';
import { FiX, FiShoppingBag, FiUser, FiMail, FiMapPin, FiCreditCard, FiAlertCircle, FiClock, FiPhone, FiLoader } from 'react-icons/fi';
import * as api from '../../utils/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const statusColors = {
  'Pending': 'badge-warning',
  'Processing': 'badge-info',
  'Shipped': 'badge-primary',
  'Delivered': 'badge-success',
  'Cancelled': 'badge-error',
};

// Helper to get a display name from a multilingual object or string
const getDisplayName = (name) => {
  if (!name) return 'N/A';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') return name.en || name.ar || Object.values(name)[0] || 'N/A';
  return 'N/A';
};

const OrderDetailsModal = ({ orderId, onClose, onStatusUpdated }) => {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopDetails, setShopDetails] = useState(null);
  const [userData, setUserData] = useState(null);
  const [productsMap, setProductsMap] = useState({});
  const [status, setStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { user: currentUser } = useAuth();
  
  // Check if user is a worker or shop admin
  const isWorker = currentUser?.role === 'worker';
  const isShopAdmin = currentUser?.role === 'shop_admin';
  
  // Sync status with order after order is fetched
  useEffect(() => {
    if (order && order.status) {
      setStatus(order.status);
    }
  }, [order]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get(`/api/orders/order/${orderId}`);
        console.log('Order details response:', data);
        setOrder(data.data || data);
        console.log(data.data || data, "Status");

        // Fetch shop details if shop ID exists
        if (data.shop) {
          try {
            const shopData = await api.get(`/api/shops/${data.shop}`);
            setShopDetails(shopData.data || shopData);
          } catch (err) {
            console.error('Failed to fetch shop details:', err);
          }
        }
        console.log(data.user);

        // Fetch user details if user ID exists
        if (data.user) {
          try {
            const userData = await api.get(`/api/auth/user/${data.user}`);
            console.log(userData);

            setUserData(userData.data || userData);
          } catch (err) {
            console.error('Failed to fetch user details:', err);
          }
        }

        // Fetch product details for each item
        const items = (data.data || data).items || [];
        const productIds = items.map(item => item.product).filter(Boolean);
        const uniqueProductIds = [...new Set(productIds)];
        const productsFetched = {};
        await Promise.all(uniqueProductIds.map(async (pid) => {
          try {
            const prod = await api.get(`/api/products/${pid}`);
            productsFetched[pid] = prod.data || prod;
          } catch (err) {
            productsFetched[pid] = null;
          }
        }));
        setProductsMap(productsFetched);
      } catch (err) {
        let errorMsg = 'Failed to fetch order details.';
        if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        }
        setError(errorMsg);
        console.error('Order details fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative animate-fade-in overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <FiX className="h-6 w-6" />
        </button>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <FiClock className="h-10 w-10 animate-spin text-gray-400 mb-2" />
            <span className="text-gray-500">Loading order details...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <FiAlertCircle className="h-10 w-10 text-error-500 mb-2" />
            <span className="text-error-500">{error}</span>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center mt-10 md:justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold mb-1">Order No: <span className="text-primary-600">{order._id}</span></h2>
                <div className="flex items-center gap-2 text-lg font-semibold ">
                  <h2 className="text-2xl font-bold mb-1"> Shop Name - </h2>{getDisplayName(shopDetails?.name) || 'Shop'}
                  <span className={`ml-3 badge ${statusColors[order.status] || 'badge-secondary'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <div>Order Created at</div>
                <div className="font-medium text-gray-900">{format(new Date(order.createdAt), 'dd MMM yyyy')}</div>
                <div>{format(new Date(order.createdAt), 'hh:mm a')}</div>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Customer</span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <FiUser className="text-blue-500" />
                  <span className="font-medium ">{userData?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <FiMail className="text-blue-500" />
                  <span className="">{userData?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <FiMapPin className="text-blue-500" />
                  <span>{order.deliveryAddress?.street || 'N/A'}</span>
                  {order.deliveryAddress?.latitude && order.deliveryAddress?.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on Map
                    </a>
                  )}
                </div>
                {order.deliveryAddress && (
                  <div className="ml-7 text-xs text-gray-500">
                    {order.deliveryAddress.city}, {order.deliveryAddress.country}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <FiPhone className="text-blue-500" />
                  <span className="">{order?.deliveryAddress?.phone ||userData?.profile?.phone || userData?.contact || 'N/A'}</span>
                </div>
              </div>
              <div className="card">
                <div className="font-semibold mb-2">Payment & Shipping</div>
                <div className="flex items-center gap-2 mb-1">
                  <FiCreditCard className="text-primary-500" />
                  <span>Payment method:</span>
                  <span className="font-medium capitalize">{order.paymentInfo?.method?.replace(/_/g, ' ') || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span>Payment Status:</span>
                  <span className={`font-medium capitalize px-2 py-1 rounded-full text-xs ${
                    order.paymentInfo?.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.paymentInfo?.status === 'refunded' ? 'bg-red-100 text-red-800' :
                    order.paymentInfo?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.paymentInfo?.status || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span>Delivery Fee:</span>
                  <span className="font-medium"><span className='text-xs'>QAR </span>{order.pricing?.deliveryFee?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <div className="mt-4 md:col-span-2 flex items-end gap-3">
                <div className="flex-1">
                  <label htmlFor="order-status" className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                  <select
                    id="order-status"
                    className="block w-full rounded-md border border-blue-400 bg-white shadow-sm focus:border-blue-600 focus:ring-blue-500 text-base py-2 px-3 font-semibold text-gray-800"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    disabled={!isWorker && !isShopAdmin}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                    <option value="24Hrs">24Hrs</option>
                    <option value="48Hrs">48Hrs</option>
                  </select>
                </div>
                {(isWorker || isShopAdmin) && (
                  <button
                    className="ml-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    disabled={isUpdatingStatus || !order || status === order.status}
                    onClick={async () => {
                      if (!order || status === order.status) return;
                      setIsUpdatingStatus(true);
                      try {
                        // Determine payment status based on order status
                        let paymentStatus = order.paymentInfo?.status || 'pending';
                        
                        if (status === 'delivered') {
                          paymentStatus = 'completed';
                        } else if (status === 'cancelled' || status === 'refunded') {
                          paymentStatus = 'refunded';
                        }

                        await api.put(`/api/orders/${order._id}/status`, { 
                          status,
                          paymentStatus, // Include payment status update
                          updatedBy: currentUser._id, // Track who made the update
                          role: currentUser.role // Track the role of who made the update
                        });
                        
                        toast.success('Order status updated!');
                        
                        // Update local state with new status and payment status
                        const updatedOrder = {
                          ...order, 
                          status,
                          paymentInfo: {
                            ...order.paymentInfo,
                            status: paymentStatus
                          }
                        };
                        setOrder(updatedOrder);
                        
                        if (onStatusUpdated) onStatusUpdated();
                      } catch (err) {
                        console.error('Status update error:', err);
                        const errorMessage = err.response?.data?.message || 'Failed to update status';
                        toast.error(errorMessage);
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }}
                  >
                    {isUpdatingStatus ? (
                      <FiLoader className="animate-spin mr-2 h-5 w-5" />
                    ) : null}
                    Update Status
                  </button>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <div className="font-semibold">Order Items</div>
                <div className="font-semibold text-right">Single Product price</div>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items && order.items.length > 0 ? order.items.map((item, idx) => {
                  const product = productsMap[item.product];
                  // Prefer variantSnapshot.name, fallback to product name
                  const displayName = getDisplayName(item.variantSnapshot?.name) || getDisplayName(product?.name);
                  // Prefer product.baseImage[0], fallback to product.image
                  const imageUrl = product?.baseImage && Array.isArray(product.baseImage) && product.baseImage.length > 0
                    ? product.baseImage[0]
                    : (product?.image || null);
                  return (
                    <div key={idx} className="flex items-center py-3 gap-4 justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-14 w-14 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={displayName}
                              className="h-14 w-14 rounded-md object-cover"
                            />
                          ) : (
                            <FiShoppingBag className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{displayName}</div>
                          <div className="text-xs text-gray-500">Qty: {item.quantity || 1}</div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-xl text-gray-900 min-w-[120px]">
                        <span className='text-xs'>
                          QAR </span> {item.unitPrice ? item.unitPrice : '0.00'}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-gray-400 py-4 text-center">No products in this order.</div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <div className="font-semibold mb-2">Order Summary</div>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span><span className='text-xs'>
                      QAR </span>{order.pricing?.subtotal || '0.00'}</span>
                  </div>
                  {order.pricing?.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tax:</span>
                      <span className="text-blue-700"><span className='text-xs'>
                        QAR </span>{order.pricing.tax}</span>
                    </div>
                  )}
                  {order.pricing?.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Delivery:</span>
                      <span className="text-blue-700"><span className='text-xs'>
                        QAR </span>{order.pricing.deliveryFee}</span>
                    </div>
                  )}
                  {order.pricing?.discount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span className="text-blue-700">Discount:</span>
                      <span className="text-blue-600">-<span className='text-xs'>
                        QAR </span>{order.pricing.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2">
                    <span className="text-blue-700">Total:</span>
                    <span className="text-blue-600"><span className='text-xs'>
                      QAR </span>{order.pricing?.totalAmount || '0.00'}</span>
                  </div>
                </div>
              </div>
              {/* Status History */}
              <div className="card">
                <div className="font-semibold mb-2">Status History</div>
                <div className="flex flex-col gap-2">
                  {order.timeline && order.timeline.length > 0 ? order.timeline.map((status, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary-500"></span>
                      <span>{status.status}</span>
                      <span className="text-gray-400">{status.by ? `by ${status.by}` : ''}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {format(new Date(status.timestamp), 'dd MMM yyyy, hh:mm a')}
                      </span>
                    </div>
                  )) : (
                    <div className="text-gray-400">No status history available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderDetailsModal; 
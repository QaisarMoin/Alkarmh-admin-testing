import React, { useEffect, useState } from 'react';
import * as api from '../utils/api';
import { FaShoppingCart, FaHeart, FaCrown, FaUser } from "react-icons/fa";
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
const Customers = () => {
const { user: currentUser } = useAuth();
const [shopPremiumCustomers, setShopPremiumCustomers] = useState([]);
const [customers, setCustomers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [productNames, setProductNames] = useState({});
const [productsLoading, setProductsLoading] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [searchTerm, setSearchTerm] = useState('');
const [filterPremium, setFilterPremium] = useState('all'); // 'all', 'premium', 'regular'
const [isUpdatingPremium, setIsUpdatingPremium] = useState(false);
const CUSTOMERS_PER_PAGE = 10;

  // Get current shop ID
const getCurrentShopId = () => {
    if (currentUser?.managedShops && currentUser.managedShops.length > 0) {
      return typeof currentUser.managedShops[0] === 'object' 
        ? currentUser.managedShops[0]._id 
        : currentUser.managedShops[0];
    }
    return null;
  };
  

  // Fetch shop premium customers once
const fetchShopPremiumCustomers = async () => {
    const shopId = getCurrentShopId();
    if (!shopId) return;
  
    try {
      const data = await api.get(`/api/shops/${shopId}/premium-customers`);
      setShopPremiumCustomers(data.data || data || []);
    } catch (err) {
      console.error('Failed to fetch shop premium customers:', err);
      setShopPremiumCustomers([]);
    }
  };
  
  useEffect(() => {
    fetchCustomers();
    fetchShopPremiumCustomers();  // fetch on mount
  }, []);
  
  
  // Check if customer is premium for current shop
  const isCustomerPremiumForShop = (customerId) => {
    return shopPremiumCustomers.some(
      premiumCustomer =>
        (typeof premiumCustomer === 'object' ? premiumCustomer._id : premiumCustomer) === customerId
    );
  };
  

  // Fetch customers function
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/auth/alluser');
      const allUsers = data.data || data;
      const customerUsers = allUsers.filter(user => user.role === 'customer');
      setCustomers(customerUsers);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to fetch customers.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchShopPremiumCustomers();  // fetch on mount


  }, []);

  // Filter customers based on search and premium status
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.profile?.phone?.includes(searchTerm);
    
                         const isPremiumForShop = isCustomerPremiumForShop(customer._id);
                         const matchesPremium = filterPremium === 'all' || 
                                               (filterPremium === 'premium' && isPremiumForShop) ||
                                               (filterPremium === 'regular' && !isPremiumForShop);
    
    return matchesSearch && matchesPremium;
  });

  const totalPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * CUSTOMERS_PER_PAGE, 
    currentPage * CUSTOMERS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPremium]);

  // Helper to get product ID from cart item
  const getCartProductId = (item) => item.product;
  
  // Helper to get display name from string or {en, ar} object
  const getDisplayName = (name) => {
    if (!name) return 'Product';
    if (typeof name === 'string') return name;
    if (typeof name === 'object') return name.en || name.ar || 'Product';
    return 'Product';
  };

  // Open customer details modal
  const openModal = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    setProductNames({});
    setProductsLoading(false);
  };

  // Close modal
  const closeModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(false);
    setProductNames({});
  };

  const handlePremiumStatusUpdate = async (customerId, isPremium) => {
    const shopId = getCurrentShopId();
    if (!shopId) {
      toast.error('No shop found for current user.');
      return;
    }
  
    setIsUpdatingPremium(true);
    try {
      if (isPremium) {
        // Add customer as premium for this shop
        await api.post(`/api/auth/${shopId}/add-shop-premium-customer`, { customerId , shopId });
        toast.success('Customer upgraded to premium successfully!');
        // Update local state
        setShopPremiumCustomers(prev => [...prev, customerId]);
      } else {
        // Remove customer from premium for this shop
        await api.post(`/api/auth/${shopId}/remove-shop-premium-customer`, { customerId , shopId });
        toast.success('Customer downgraded from premium successfully!');
        // Update local state
        setShopPremiumCustomers(prev => [...prev, customerId]);  // add

      }
      
      // Update selected customer if modal is open
      if (selectedCustomer && selectedCustomer._id === customerId) {
        setSelectedCustomer(prev => ({ ...prev, isPremiumForShop: isPremium }));
      }
    } catch (err) {
      toast.error('Failed to update premium status.');
      console.error('Premium status update error:', err);
    } finally {
      setIsUpdatingPremium(false);
    }
  };

  // Fetch product names for cart and favorites
  useEffect(() => {
    const fetchProductNames = async () => {
      if (!isModalOpen || !selectedCustomer) return;
      setProductsLoading(true);
      
      const ids = [];
      if (selectedCustomer.cart) {
        selectedCustomer.cart.forEach(item => {
          const pid = getCartProductId(item);
          if (pid && !productNames[pid]) ids.push(pid);
        });
      }
      if (selectedCustomer.favorites) {
        selectedCustomer.favorites.forEach(pid => {
          if (pid && !productNames[pid]) ids.push(pid);
        });
      }
      
      const uniqueIds = [...new Set(ids)];
      const newNames = {};
      
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const data = await api.get(`/api/products/${id}`);
          newNames[id] = data.data?.name || data.name || 'Product';
        } catch {
          newNames[id] = 'Product';
        }
      }));
      
      setProductNames(prev => ({ ...prev, ...newNames }));
      setProductsLoading(false);
    };
    
    fetchProductNames();
  }, [isModalOpen, selectedCustomer]);

  return (
    <div className="w-full p-8 bg-white rounded-xl shadow-lg mt-8">
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
          <span>Dashboard</span>
          <span className="mx-1">&gt;</span>
          <span className="text-primary-700 font-semibold">Customers</span>
        </div>
        <h1 className="text-3xl font-bold mb-1 text-primary-900">Customer Management</h1>
        <p className="text-lg text-gray-600 mb-4">Manage customers and premium memberships</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filterPremium}
            onChange={(e) => setFilterPremium(e.target.value)}
          >
            <option value="all">All Customers</option>
            <option value="premium">Premium Only</option>
            <option value="regular">Regular Only</option>
          </select>

        </div>
      </div>

      <div className="card p-0 bg-gray-50 border border-gray-200 rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b bg-white">
          <h2 className="text-xl font-semibold text-gray-800">
            Customer List ({filteredCustomers.length} customers)
          </h2>
        </div>
        
        <div className="px-6 pb-6 pt-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading customers...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <FaUser className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name || 'Unknown Name'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">
                        {customer.email || 'Unknown Email'}
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-900">
                        {customer.profile?.phone || 'Unknown Phone'}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {customer.isActive ? 'active' : 'not active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                        {isCustomerPremiumForShop(customer._id) ? (
  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
    <FaCrown className="h-3 w-3" />
    Premium
  </span>
) : (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
    Regular
  </span>
)}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <button 
                            className="btn btn-secondary btn-xs"
                            onClick={() => openModal(customer)}
                          >
                            View Details
                          </button>
                          <button
                            className={`btn btn-xs ${
                              isCustomerPremiumForShop(customer._id) ? 'btn-outline-warning' : 'btn-warning'
                            }`}
                            onClick={() => handlePremiumStatusUpdate(customer._id, !isCustomerPremiumForShop(customer._id))}
                            disabled={isUpdatingPremium}
                          >
                            {isUpdatingPremium ? 'Updating...' : (isCustomerPremiumForShop(customer._id) ? 'Remove Premium' : 'Make Premium')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2 md:px-6 py-4 border-t border-gray-100">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredCustomers.length === 0 ? 0 : ((currentPage - 1) * CUSTOMERS_PER_PAGE + 1)}</span> to <span className="font-medium">{Math.min(currentPage * CUSTOMERS_PER_PAGE, filteredCustomers.length)}</span> of <span className="font-medium">{filteredCustomers.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="btn btn-secondary py-1"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
            <span className="text-sm">Page {currentPage} of {totalPages || 1}</span>
            <button
              className="btn btn-secondary py-1"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-2xl p-10 w-full max-w-2xl relative border border-gray-200 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 text-2xl transition"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            
            <h2 className="text-3xl font-extrabold mb-8 text-primary-700 tracking-tight text-center">
              Customer Details
            </h2>
            
            {/* Customer Basic Info */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                <div className="flex-shrink-0 h-16 w-16">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <FaUser className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedCustomer.name || 'Unknown Name'}
                    </h3>
                    {selectedCustomer.isPremium && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        <FaCrown className="h-3 w-3" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{selectedCustomer.email || 'Unknown Email'}</p>
                  <p className="text-gray-600">{selectedCustomer.profile?.phone || 'Unknown Phone'}</p>
                </div>
              </div>
            </div>

            {/* Premium Status Management */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Premium Status Management</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Status:</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedCustomer.isPremium 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedCustomer.isPremium && <FaCrown className="h-3 w-3" />}
                    {selectedCustomer.isPremium ? 'Premium Member' : 'Regular Customer'}
                  </span>
                </div>
                <button
                  className={`btn ${
                    selectedCustomer.isPremium ? 'btn-outline-warning' : 'btn-warning'
                  } flex items-center gap-2`}
                  onClick={() => handlePremiumStatusUpdate(selectedCustomer._id, !selectedCustomer.isPremium)}
                  disabled={isUpdatingPremium}
                >
                  {isUpdatingPremium ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  ) : (
                    <FaCrown className="h-4 w-4" />
                  )}
                  {isUpdatingPremium 
                    ? 'Updating...' 
                    : (selectedCustomer.isPremium ? 'Remove Premium' : 'Upgrade to Premium')
                  }
                </button>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Cart Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 font-bold text-gray-700 mb-2">
                <FaShoppingCart className="h-4 w-4" />
                Cart ({selectedCustomer.cart?.length || 0} items)
              </div>
              {productsLoading ? (
                <div className="text-sm text-gray-500">Loading products...</div>
              ) : Array.isArray(selectedCustomer.cart) && selectedCustomer.cart.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCustomer.cart.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                      title={getDisplayName(productNames[getCartProductId(item)])}
                    >
                      <span className="truncate max-w-[120px] font-medium text-gray-800">
                        {getDisplayName(productNames[getCartProductId(item)])}
                      </span>
                      <span className="ml-4 text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Qty:</span> {item.quantity || 1}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-400">No items in cart.</div>
              )}
            </div>

            {/* Favorites Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 font-bold text-gray-700 mb-2">
                <FaHeart className="h-4 w-4" />
                Favorites ({selectedCustomer.favorites?.length || 0} items)
              </div>
              {productsLoading ? (
                <div className="text-sm text-gray-500">Loading products...</div>
              ) : Array.isArray(selectedCustomer.favorites) && selectedCustomer.favorites.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCustomer.favorites.map((pid, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                      title={getDisplayName(productNames[pid])}
                    >
                      <span className="truncate max-w-[160px] font-medium text-gray-800">
                        {getDisplayName(productNames[pid])}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-400">No favorites.</div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <button
                className="px-8 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition text-lg"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

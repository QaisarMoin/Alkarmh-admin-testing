import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import { toast } from 'react-toastify';
import SearchFilter from '../../components/ui/SearchFilter';
import PageHeader from '../../components/ui/PageHeader';

const SuperAdminCustomers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productNames, setProductNames] = useState({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const USERS_PER_PAGE = 10;

  // Helper functions from original SuperAdmin
  const getDisplayName = (name) => {
    if (!name) return 'Product Not Found';
    if (typeof name === 'string') return name;
    if (typeof name === 'object') return name.en || name.ar || 'Product Not Found';
    return 'Product Not Found';
  };

  const getCartProductId = (item) => {
    if (!item) return null;
    return item.productId || item.product?._id || item.product?.id || item.product || item._id || item.id || null;
  };

  // Fetch users function
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/auth/alluser');
      setUsers(data.data || data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Get customer priority based on cart and favorites
  const getCustomerPriority = (customer) => {
    const hasCart = customer.cart && customer.cart.length > 0;
    const hasFavorites = customer.favorites && customer.favorites.length > 0;
    
    if (hasCart && hasFavorites) return 1; // Cart + Fav (highest priority)
    if (hasCart) return 2; // Cart only
    if (hasFavorites) return 3; // Fav only
    return 4; // Neither (lowest priority)
  };

  // Filter configuration for SearchFilter component
  const filterConfig = [
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'cart-fav', label: 'Cart + Favorites' },
        { value: 'cart', label: 'Cart Only' },
        { value: 'fav', label: 'Favorites Only' },
        { value: 'others', label: 'Others' }
      ]
    }
  ];

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setSelectedFilters(filters);
  };

  // Filter and sort customers based on search and priority
  const filteredUsers = users
    .filter(user => user.role === 'customer')
    .filter(customer => {
      // Search filter
      const matchesSearch = !searchQuery || 
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.profile?.phone?.includes(searchQuery);
      
      // Priority filter
      const priorityFilter = selectedFilters.priority;
      const hasCart = customer.cart && customer.cart.length > 0;
      const hasFavorites = customer.favorites && customer.favorites.length > 0;
      
      const matchesPriority = !priorityFilter || 
                             (priorityFilter === 'cart-fav' && hasCart && hasFavorites) ||
                             (priorityFilter === 'cart' && hasCart && !hasFavorites) ||
                             (priorityFilter === 'fav' && hasFavorites && !hasCart) ||
                             (priorityFilter === 'others' && !hasCart && !hasFavorites);
      
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      // Sort by priority: lower number = higher priority
      return getCustomerPriority(a) - getCustomerPriority(b);
    });

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilters]);

  const openModal = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setProductNames({});
    setProductsLoading(false);

    // Fetch product names for cart and favorites
    if (user.role === 'customer') {
      setProductsLoading(true);
      const allProductIds = new Set();
      
      if (Array.isArray(user.cart)) {
        user.cart.forEach(item => {
          const pid = getCartProductId(item);
          if (pid) allProductIds.add(pid);
        });
      }
      
      if (Array.isArray(user.favorites)) {
        user.favorites.forEach(pid => {
          if (pid) allProductIds.add(pid);
        });
      }

      if (allProductIds.size > 0) {
        try {
          const names = {};
          await Promise.all([...allProductIds].map(async (pid) => {
            try {
              const productData = await api.get(`/api/products/${pid}`);
              names[pid] = productData.data?.name || productData.name || `Product ${pid}`;
            } catch {
              names[pid] = `Product ${pid}`;
            }
          }));
          setProductNames(names);
        } catch (error) {
          console.error('Error fetching product names:', error);
        }
      }
      
      setProductsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <PageHeader 
        title="Customer Panel"
        subtitle="Manage all customers"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Customer Panel' }
        ]}
      />

      {/* Search and Filter */}
      <div className="card mb-6">
        <SearchFilter
          onSearch={(query, filters) => {
            setSearchQuery(query);
            setSelectedFilters(filters);
          }}
          placeholder="Search customers by name, email, or phone..."
          filters={filterConfig}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="card p-0 bg-gray-50 border border-gray-200 rounded-lg shadow mb-8 w-full">
        <div className="px-6 pb-6 pt-4">
          <p className="text-base text-gray-700 mb-4">
            All Customers {filteredUsers.length > 0 && `(${filteredUsers.length})`}
          </p>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-middle font-medium text-gray-900">{user.name || 'unknown-name'}</td>
                      <td className="px-6 py-4 align-middle">
                        <span title={user.email || 'unknown-email'}>
                          {(user.email || 'unknown-email').length > 15 
                            ? `${(user.email || 'unknown-email').substring(0, 15)}...` 
                            : (user.email || 'unknown-email')
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">{user.profile?.phone || 'unknown-phone'}</td>
                      <td className="px-6 py-4 align-middle">{user.role || 'User'}</td>
                      <td className="px-6 py-4 align-middle">
                        <button className="btn btn-secondary btn-xs" onClick={() => openModal(user)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">No users found for this role.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-2 md:px-6 py-4 border-t border-gray-100">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredUsers.length === 0 ? 0 : ((currentPage - 1) * USERS_PER_PAGE + 1)}</span> to <span className="font-medium">{Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
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

      {/* User Info Modal - Exact same as original */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 ">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-2xl p-10 w-full max-w-xl relative border border-gray-200">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 text-2xl transition"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-3xl font-extrabold mb-8 text-primary-700 tracking-tight text-center">User Information</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 overflow-hidden ">
              <div className="col-span-2 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Name:</span>
                  <span className="font-bold text-gray-900">{selectedUser.name || 'unknown-name'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Email:</span>
                  <span className="text-gray-700">{selectedUser.email || 'unknown-email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Phone:</span>
                  <span className="text-gray-700">{selectedUser.profile?.phone || 'unknown-phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Role:</span>
                  <span className="capitalize">{selectedUser.role || 'unknown-role'}</span>
                </div>
              </div>
            </div>
            <div className="border-t my-4" />
            {/* Cart and Favorites for customers only */}
            {selectedUser.role === 'customer' && (
              <>
                {/* Cart Section */}
                <div className="mb-4">
                  <div className="font-bold text-gray-700 mb-2">Cart</div>
                  {productsLoading ? (
                    <div className="text-sm text-gray-500">Loading products...</div>
                  ) : Array.isArray(selectedUser.cart) && selectedUser.cart.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedUser.cart.map((item, idx) => (
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
                <div>
                  <div className="font-bold text-gray-700 mb-2">Favorites</div>
                  {productsLoading ? (
                    <div className="text-sm text-gray-500">Loading products...</div>
                  ) : Array.isArray(selectedUser.favorites) && selectedUser.favorites.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedUser.favorites.map((pid, idx) => (
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
              </>
            )}
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

export default SuperAdminCustomers;

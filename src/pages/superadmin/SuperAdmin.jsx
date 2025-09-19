import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import { FaShoppingCart, FaHeart } from "react-icons/fa";
import { toast } from 'react-toastify';

const TABS = [
  { label: 'Customer', value: 'customer' },
  { label: 'Shop Admin', value: 'shop_admin' },
  { label: 'Super Admin', value: 'super_admin' },
];

function ShopNames({ managedShops }) {
  const [shopNames, setShopNames] = React.useState([]);
  React.useEffect(() => {
    if (!managedShops || managedShops.length === 0) {
      setShopNames([]);
      return;
    }
    // If already populated with name
    if (typeof managedShops[0] === 'object' && managedShops[0]?.name) {
      setShopNames(managedShops.map(shop => typeof shop.name === 'object' ? (shop.name.en || shop.name.ar || 'Shop') : shop.name));
      return;
    }
    // Otherwise, fetch shop details by ID
    const fetchNames = async () => {
      const names = await Promise.all(managedShops.map(async (id) => {
        try {
          const data = await api.get(`/api/shops/${typeof id === 'object' && id._id ? id._id : id}`);
          if (data && data.data && data.data.name) {
            return typeof data.data.name === 'object' ? (data.data.name.en || data.data.name.ar || 'Shop') : data.data.name;
          }
          if (data && data.name) {
            return typeof data.name === 'object' ? (data.name.en || data.name.ar || 'Shop') : data.name;
          }
          return 'Shop';
        } catch {
          return 'Shop';
        }
      }));
      setShopNames(names);
    };
    fetchNames();
  }, [managedShops]);
  if (!managedShops || managedShops.length === 0) return <span className="text-gray-400">No shops</span>;
  return <span>{shopNames.join(', ')}</span>;
}

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('customer');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [productNames, setProductNames] = useState({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [shopDetailsById, setShopDetailsById] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null);
  const [shopStatusLoading, setShopStatusLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1)
  const USERS_PER_PAGE = 10
  const [shopRating, setShopRating] = useState(0);
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  const [shopTags, setShopTags] = useState({
    last100orderwithoutcomplaints: false,
    Bestsellers: false,
    FrequentlyReordered: false,
  });
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending_approval', label: 'Pending Approval' },
  ];

  // Extracted fetchUsers function
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/auth/alluser');
      setUsers(data.data || data);
      setLoading(false);
      // Fetch shop details for all shop_admins
      const shopAdminUsers = (data.data || data).filter(u => u.role === 'shop_admin');
      const shopIds = shopAdminUsers.flatMap(u => Array.isArray(u.managedShops) ? u.managedShops : [0]).filter(Boolean);
      const uniqueShopIds = [...new Set(shopIds.map(id => (typeof id === 'object' && id._id) ? id._id : id))];
      if (uniqueShopIds.length > 0) {
        Promise.all(uniqueShopIds.map(id => api.get(`/api/shops/${id}`)))
          .then(responses => {
            const details = {};
            responses.forEach((resp, idx) => {
              const shopId = uniqueShopIds[idx];
              details[shopId] = resp.data || resp;
            });
            setShopDetailsById(details);
          });
      }
    } catch (err) {
      setError('Failed to fetch users.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => user.role === activeTab);
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const openModal = async (user) => {
    let initialStatus = user.status;
    setShopStatusLoading(false);
    if (user.role === 'shop_admin' && user.managedShops && user.managedShops.length > 0) {
      const shopId = typeof user.managedShops[0] === 'object' && user.managedShops[0]._id ? user.managedShops[0]._id : user.managedShops[0];
      const shop = shopDetailsById[shopId];
      if (shop && (shop.status || shop.shopStatus || shop.isActive || shop.active)) {
        initialStatus = shop.status || shop.shopStatus || shop.isActive || shop.active;
      } else {
        setShopStatusLoading(true);
        try {
          const shopData = await api.get(`/api/shops/${shopId}`);
          const backendStatus = shopData.data?.status || shopData.data?.shopStatus || shopData.data?.isActive || shopData.data?.active;
          setEditUser({ ...user, status: backendStatus });
          setOriginalStatus(backendStatus);
          setShopStatusLoading(false);
        } catch {
          setEditUser({ ...user, status: initialStatus });
          setOriginalStatus(initialStatus);
          setShopStatusLoading(false);
        }
        setSelectedUser(user);
        setIsModalOpen(true);
        setShopInfo(null);
        setProductNames({});
        setProductsLoading(false);
        // Fetch shop info for Shop Name display
        let shopIdForInfo = null;
        if (Array.isArray(user.managedShop) && user.managedShop.length > 0) {
          shopIdForInfo = user.managedShop[0];
        } else if (Array.isArray(user.managedShops) && user.managedShops.length > 0) {
          shopIdForInfo = user.managedShops[0];
        } else if (user.shop) {
          shopIdForInfo = user.shop;
        }
        if (shopIdForInfo) {
          try {
            const shopData = await api.get(`/api/shops/${typeof shopIdForInfo === 'object' && shopIdForInfo._id ? shopIdForInfo._id : shopIdForInfo}`);
            const shop = shopData.data || shopData;
            setShopInfo(shop);
            setShopRating(shop.statistics?.rating || 0);
          } catch (err) {
            setShopInfo({ name: 'N/A' });
          }
        } else {
          setShopInfo({ name: 'N/A' });
        }
        return;
      }
    }
    setSelectedUser(user);
    setEditUser({ ...user, status: initialStatus });
    setOriginalStatus(initialStatus);
    setIsModalOpen(true);
    setShopInfo(null);
    setProductNames({});
    setProductsLoading(false);
    // Fetch shop info for Shop Name display
    if (user.role === 'shop_admin') {
      let shopIdForInfo = null;
      if (Array.isArray(user.managedShop) && user.managedShop.length > 0) {
        shopIdForInfo = user.managedShop[0];
      } else if (Array.isArray(user.managedShops) && user.managedShops.length > 0) {
        shopIdForInfo = user.managedShops[0];
      } else if (user.shop) {
        shopIdForInfo = user.shop;
      }
      if (shopIdForInfo) {
        try {
          const shopData = await api.get(`/api/shops/${typeof shopIdForInfo === 'object' && shopIdForInfo._id ? shopIdForInfo._id : shopIdForInfo}`);
          const shop = shopData.data || shopData;
          setShopInfo(shop);
          setShopRating(shop.statistics.rating || 0);

          setShopTags(
            shop.tags || {
              last100orderwithoutcomplaints: false,
              Bestsellers: false,
              FrequentlyReordered: false,
            }
          );
        } catch (err) {
          setShopInfo({ name: 'N/A' });
        }
      } else {
        setShopInfo({ name: 'N/A' });
      }
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setEditUser(null);
    setIsModalOpen(false);
    setShopInfo(null);
    setShopRating(0);
    setIsUpdatingRating(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
  };
  const handleTagsUpdate = async () => {
    if (!shopInfo || !selectedUser || selectedUser.role !== "shop_admin") return;
  
    let shopId = null;
    if (Array.isArray(selectedUser.managedShop) && selectedUser.managedShop.length > 0) {
      shopId = selectedUser.managedShop[0];
    } else if (Array.isArray(selectedUser.managedShops) && selectedUser.managedShops.length > 0) {
      shopId = selectedUser.managedShops[0];
    } else if (selectedUser.shop) {
      shopId = selectedUser.shop;
    }
  
    if (!shopId) {
      toast.error("No shop found for this admin.");
      return;
    }
  
    setIsUpdatingTags(true);
    try {
      await api.put(
        `/api/shops/${typeof shopId === "object" && shopId._id ? shopId._id : shopId}/tags`,
        { tags: shopTags }
      );
      toast.success("Shop tags updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message,);
    } finally {
      setIsUpdatingTags(false);
    }
  };
  
  const handleSave = async () => {
    if (editUser && editUser.role === 'shop_admin') {
      let shopId = null;
      if (Array.isArray(editUser.managedShop) && editUser.managedShop.length > 0) {
        shopId = editUser.managedShop[0];
      } else if (Array.isArray(editUser.managedShops) && editUser.managedShops.length > 0) {
        shopId = editUser.managedShops[0];
      } else if (editUser.shop) {
        shopId = editUser.shop;
      }
      if (!shopId) {
        toast.error('No shop found for this admin.', { position: 'bottom-right' });
        return;
      }
      setIsUpdatingStatus(true);
      try {
        await api.put(`/api/shops/${typeof shopId === 'object' && shopId._id ? shopId._id : shopId}/status`, { status: editUser.status });
        toast.success('Shop status updated successfully!', { position: 'bottom-right' });
        setOriginalStatus(editUser.status);
        closeModal();
        // Reload users after status update
        fetchUsers();
      } catch (err) {
        toast.error('Failed to update shop status.', { position: 'bottom-right' });
      } finally {
        setIsUpdatingStatus(false);
      }
    } else {
      closeModal();
    }
  };

  const handleRatingUpdate = async () => {
    if (!shopInfo || !selectedUser || selectedUser.role !== 'shop_admin') return;
    
    let shopId = null;
    if (Array.isArray(selectedUser.managedShop) && selectedUser.managedShop.length > 0) {
      shopId = selectedUser.managedShop[0];
    } else if (Array.isArray(selectedUser.managedShops) && selectedUser.managedShops.length > 0) {
      shopId = selectedUser.managedShops[0];
    } else if (selectedUser.shop) {
      shopId = selectedUser.shop;
    }
    
    if (!shopId) {
      toast.error('No shop found for this admin.', { position: 'bottom-right' });
      return;
    }
    
    setIsUpdatingRating(true);
    try {
      await api.put(`/api/shops/${typeof shopId === 'object' && shopId._id ? shopId._id : shopId}/rating`, { 
        rating: shopRating 
      });
      toast.success('Shop rating updated successfully!', { position: 'bottom-right' });
      setShopInfo(prev => ({ 
        ...prev, 
        statistics: { 
          ...prev.statistics, 
          rating: shopRating 
        } 
      }));
    } catch (err) {
      toast.error('Failed to update shop rating.', { position: 'bottom-right' });
    } finally {
      setIsUpdatingRating(false);
    }
  };

  // Helper to get product ID from cart item
  const getCartProductId = (item) => item.product;
  // Helper to get display name from string or {en, ar} object
  const getDisplayName = (name) => {
    if (!name) return 'Product';
    if (typeof name === 'string') return name;
    if (typeof name === 'object') return name.en || name.ar || 'Product';
    return 'Product';
  };

  // Fetch product names for cart and favorites
  useEffect(() => {
    if (isModalOpen && selectedUser && selectedUser.role === 'customer') {
      console.log('Cart:', selectedUser.cart);
      console.log('Favorites:', selectedUser.favorites);
    }
    const fetchProductNames = async () => {
      if (!isModalOpen || !selectedUser || selectedUser.role !== 'customer') return;
      setProductsLoading(true);
      const ids = [];
      if (selectedUser.cart) {
        selectedUser.cart.forEach(item => {
          const pid = getCartProductId(item);
          if (pid && !productNames[pid]) ids.push(pid);
        });
      }
      if (selectedUser.favorites) {
        selectedUser.favorites.forEach(pid => {
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
    // eslint-disable-next-line
  }, [isModalOpen, selectedUser]);

  useEffect(() => {
    if (
      isModalOpen &&
      selectedUser &&
      selectedUser.role === 'shop_admin' &&
      selectedUser.managedShops &&
      selectedUser.managedShops.length > 0
    ) {
      const shopId =
        typeof selectedUser.managedShops[0] === 'object' && selectedUser.managedShops[0]._id
          ? selectedUser.managedShops[0]._id
          : selectedUser.managedShops[0];
      const shop = shopDetailsById[shopId];
      if (shop && (shop.status || shop.shopStatus || shop.isActive || shop.active)) {
        const backendStatus = shop.status || shop.shopStatus || shop.isActive || shop.active;
        if (editUser && editUser.status !== backendStatus) {
          setEditUser(prev => ({ ...prev, status: backendStatus }));
        }
      }
    }
  }, [isModalOpen, selectedUser, shopDetailsById]);

  return (
    <div className="w-full p-8 bg-white rounded-xl shadow-lg mt-8">
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
          <span>Dashboard</span>
          <span className="mx-1">&gt;</span>
          <span className="text-primary-700 font-semibold">Super Admin</span>
        </div>
        <h1 className="text-3xl font-bold mb-1 text-primary-900">Super Admin Panel</h1>
        <p className="text-lg text-gray-600 mb-4">Manage users, shop admins, and super admins</p>
      </div>
      <div className="card p-0 bg-gray-50 border border-gray-200 rounded-lg shadow mb-8">
        <div className="flex gap-2 border-b px-6 pt-4 bg-white">
          {TABS.map(tab => (
            <button
              key={tab.value}
              className={`px-4 py-2 text-base font-medium border-b-2 transition-colors duration-150 ${activeTab === tab.value ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-primary-600'}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="px-6 pb-6 pt-4">
          <p className="text-base text-gray-700 mb-4">All {TABS.find(t => t.value === activeTab)?.label}s</p>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {activeTab === 'shop_admin' ? (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation Name</th>
                    ) : activeTab === 'customer' ? (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    ) : (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    {activeTab !== 'super_admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      {activeTab === 'shop_admin' ? (
                        <td className="px-6 py-4 align-middle font-medium text-gray-900">
                          <ShopNames managedShops={user.managedShops} />
                        </td>
                      ) : activeTab === 'customer' ? (
                        <td className="px-6 py-4 align-middle font-medium text-gray-900">{user.name || 'unknown-name'}</td>
                      ) : (
                        <td className="px-6 py-4 align-middle font-medium text-gray-900">{user.name || 'unknown-name'}</td>
                      )}
                      <td className="px-6 py-4 align-middle">{user.email || 'unknown-email'}</td>
                      <td className="px-6 py-4 align-middle">{user.profile?.phone || 'unknown-phone'}</td>
                      <td className="px-6 py-4 align-middle">{user.role || 'User'}</td>
                      {activeTab !== 'super_admin' && (
                        <td className="px-6 py-4 align-middle">
                          {activeTab === 'super_admin' ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-nowrap ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status || 'inactive'}</span>
                          ) : (
                            <button className="btn btn-secondary btn-xs" onClick={() => openModal(user)}>
                              {activeTab === 'customer' ? 'View' : 'Change Status'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400">No users found for this role.</td>
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
      {/* User Info Modal */}
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
              {/* Status section only for shop_admin and super_admin */}
              {selectedUser.role !== 'customer' && (
                <>
                  <div className="text-gray-500 font-medium">Status:</div>
                  <div>
                    {selectedUser.role === 'shop_admin' ? (
                      <select
                        className="form-input px-2 py-1 rounded border border-gray-300"
                        value={editUser?.status || ''}
                        onChange={e => setEditUser(prev => ({ ...prev, status: e.target.value }))}
                        disabled={shopStatusLoading}
                      >
                        {shopStatusLoading ? (
                          <option>Loading...</option>
                        ) : (
                          statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))
                        )}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedUser.status || 'inactive'}
                      </span>
                    )}
                  </div>
                </>
              )}
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
            {/* Shop Info for shop_admin only */}
            {selectedUser.role === 'shop_admin' && (
              <div className="mt-6">
                <div className="font-bold text-gray-700 mb-4">Shop Info</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Shop Name:</span>
                    <span className="font-semibold text-gray-900">
                      {shopInfo
                        ? getDisplayName(shopInfo.name)
                        : 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Current Rating:</span>
                    <span className="font-semibold text-gray-900">
                      {shopInfo?.statistics?.rating ? `${shopInfo.statistics.rating}/5` : 'No rating'}
                    </span>
                  </div>
                  
                  <div className="mt-6">
  <div className="font-bold text-gray-700 mb-4">Shop Tags</div>
  <div className="space-y-2">
    {Object.keys(shopTags).map((tag) => (
      <label key={tag} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={shopTags[tag]}
          onChange={(e) =>
            setShopTags((prev) => ({ ...prev, [tag]: e.target.checked }))
          }
        />
        <span className="capitalize">{tag}</span>
      </label>
    ))}
  </div>
  <button
    className="mt-3 px-4 py-1 rounded bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-50"
    onClick={handleTagsUpdate}
    disabled={isUpdatingTags}
  >
    {isUpdatingTags ? "Updating..." : "Update Tags"}
  </button>
</div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-medium">Update Rating:</span>
                    <select
                      className="form-input px-3 py-1 rounded border border-gray-300 text-sm"
                      value={shopRating}
                      onChange={e => setShopRating(Number(e.target.value))}
                      disabled={isUpdatingRating}
                    >
                      <option value={0}>No Rating</option>
                      <option value={1}>1 Star</option>
                      <option value={1.5}>1.5 Star</option>
                      <option value={2}>2 Stars</option>
                      <option value={2.5}>2.5 Star</option>
                      <option value={3}>3 Stars</option>
                      <option value={3.5}>3.5 Star</option>
                      <option value={4}>4 Stars</option>
                      <option value={4.5}>4.5 Star</option>
                      <option value={5}>5 Stars</option>
                    </select>
                    <button
                      className="px-4 py-1 rounded bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-50 flex items-center"
                      onClick={handleRatingUpdate}
                      disabled={isUpdatingRating || shopRating === (shopInfo?.statistics?.rating || 0)}
                    >
                      {isUpdatingRating && (
                        <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                      )}
                      Update
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-8">
              {selectedUser.role === 'customer' ? (
                <button
                  className="px-8 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition text-lg"
                  onClick={closeModal}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    className="px-8 py-2 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition text-lg flex items-center justify-center"
                    onClick={handleSave}
                    disabled={isUpdatingStatus || editUser?.status === originalStatus}
                  >
                    {isUpdatingStatus && (
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    )}
                    Save
                  </button>
                  <button
                    className="ml-4 px-8 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition text-lg"
                    onClick={closeModal}
                    disabled={isUpdatingStatus}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
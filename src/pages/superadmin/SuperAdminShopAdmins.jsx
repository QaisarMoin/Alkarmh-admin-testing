import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';

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

const SuperAdminShopAdmins = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [shopDetailsById, setShopDetailsById] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [originalStatus, setOriginalStatus] = useState(null);
  const [shopStatusLoading, setShopStatusLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [shopRating, setShopRating] = useState(0);
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  const [shopTags, setShopTags] = useState({
    last100orderwithoutcomplaints: false,
    Bestsellers: false,
    FrequentlyReordered: false,
  });
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const USERS_PER_PAGE = 10;

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending_approval', label: 'Pending Approval' },
  ];

  const getDisplayName = (name) => {
    if (!name) return 'Shop Name Not Available';
    if (typeof name === 'string') return name;
    if (typeof name === 'object') return name.en || name.ar || 'Shop Name Not Available';
    return 'Shop Name Not Available';
  };

  // Fetch users function
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



  // Filter and search shop admins
  const filteredUsers = users
    .filter(user => user.role === 'shop_admin')
    .filter(user => {
      // Search filter
      const matchesSearch = !searchQuery || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.profile?.phone?.includes(searchQuery);
      
      return matchesSearch;
    });
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
        
        // Fetch shop info for Shop Name display
        let shopIdForInfo = null;
        if (Array.isArray(user.managedShops) && user.managedShops.length > 0) {
          shopIdForInfo = typeof user.managedShops[0] === 'object' && user.managedShops[0]._id ? user.managedShops[0]._id : user.managedShops[0];
        }
        if (shopIdForInfo) {
          api.get(`/api/shops/${shopIdForInfo}`)
            .then(shopData => {
              setShopInfo(shopData.data || shopData);
              if (shopData.data?.statistics?.rating || shopData.statistics?.rating) {
                setShopRating(shopData.data?.statistics?.rating || shopData.statistics?.rating);
              }
              const tags = shopData.data?.tags || shopData.tags || {};
              setShopTags({
                last100orderwithoutcomplaints: tags.last100orderwithoutcomplaints || false,
                Bestsellers: tags.Bestsellers || false,
                FrequentlyReordered: tags.FrequentlyReordered || false,
              });
            })
            .catch(() => setShopInfo(null));
        }
        return;
      }
    }
    setEditUser({ ...user, status: initialStatus });
    setOriginalStatus(initialStatus);
    setSelectedUser(user);
    setIsModalOpen(true);
    setShopInfo(null);
    
    // Fetch shop info for Shop Name display
    let shopIdForInfo = null;
    if (Array.isArray(user.managedShops) && user.managedShops.length > 0) {
      shopIdForInfo = typeof user.managedShops[0] === 'object' && user.managedShops[0]._id ? user.managedShops[0]._id : user.managedShops[0];
    }
    if (shopIdForInfo) {
      api.get(`/api/shops/${shopIdForInfo}`)
        .then(shopData => {
          setShopInfo(shopData.data || shopData);
          if (shopData.data?.statistics?.rating || shopData.statistics?.rating) {
            setShopRating(shopData.data?.statistics?.rating || shopData.statistics?.rating);
          }
          const tags = shopData.data?.tags || shopData.tags || {};
          setShopTags({
            last100orderwithoutcomplaints: tags.last100orderwithoutcomplaints || false,
            Bestsellers: tags.Bestsellers || false,
            FrequentlyReordered: tags.FrequentlyReordered || false,
          });
        })
        .catch(() => setShopInfo(null));
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
    setEditUser(null);
    setShopInfo(null);
    setShopRating(0);
    setShopTags({
      last100orderwithoutcomplaints: false,
      Bestsellers: false,
      FrequentlyReordered: false,
    });
  };

  const handleSave = async () => {
    if (!editUser || !selectedUser) return;
    
    setIsUpdatingStatus(true);
    try {
      if (selectedUser.role === 'shop_admin' && selectedUser.managedShops && selectedUser.managedShops.length > 0) {
        const shopId = typeof selectedUser.managedShops[0] === 'object' && selectedUser.managedShops[0]._id ? selectedUser.managedShops[0]._id : selectedUser.managedShops[0];
        
        if (!shopId) {
          toast.error('Shop ID not found. Cannot update status.');
          return;
        }
        
        // Try alternative endpoint structure
        const updateData = { 
          status: editUser.status 
        };
        
        // First try the specific status endpoint
        try {
          await api.put(`/api/shops/${shopId}/status`, updateData);
        } catch (statusError) {
          // Fallback to general shop update with different structure
          await api.patch(`/api/shops/${shopId}`, updateData);
        }
        toast.success('Shop status updated successfully!');
        await fetchUsers();
      }
      closeModal();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRatingUpdate = async () => {
    if (!selectedUser || !shopInfo) return;
    
    setIsUpdatingRating(true);
    try {
      const shopId = typeof selectedUser.managedShops[0] === 'object' && selectedUser.managedShops[0]._id ? selectedUser.managedShops[0]._id : selectedUser.managedShops[0];
      
      if (!shopId) {
        toast.error('Shop ID not found. Cannot update rating.');
        return;
      }
      
      // Try alternative endpoint structure for rating
      try {
        await api.put(`/api/shops/${shopId}/rating`, {
          rating: shopRating
        });
      } catch (ratingError) {
        // Fallback to general shop update
        await api.patch(`/api/shops/${shopId}`, {
          statistics: { ...shopInfo.statistics, rating: shopRating }
        });
      }
      toast.success('Shop rating updated successfully!');
      setShopInfo(prev => ({ ...prev, statistics: { ...prev?.statistics, rating: shopRating } }));
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating. Please try again.');
    } finally {
      setIsUpdatingRating(false);
    }
  };

  const handleTagsUpdate = async () => {
    if (!selectedUser || !shopInfo) return;
    
    setIsUpdatingTags(true);
    try {
      const shopId = typeof selectedUser.managedShops[0] === 'object' && selectedUser.managedShops[0]._id ? selectedUser.managedShops[0]._id : selectedUser.managedShops[0];
      
      if (!shopId) {
        toast.error('Shop ID not found. Cannot update tags.');
        return;
      }
      
      // Try alternative endpoint structure for tags
      try {
        await api.put(`/api/shops/${shopId}/tags`, {
          tags: shopTags
        });
      } catch (tagsError) {
        // Fallback to general shop update
        await api.patch(`/api/shops/${shopId}`, {
          tags: shopTags
        });
      }
      toast.success('Shop tags updated successfully!');
      setShopInfo(prev => ({ ...prev, tags: shopTags }));
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags. Please try again.');
    } finally {
      setIsUpdatingTags(false);
    }
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <PageHeader
        title="Shop Admin Panel"
        subtitle="Manage shop administrators"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Shop Admin Panel' }
        ]}
      />

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="p-2">
          <div className="relative w-full flex">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                className="form-input pl-9 pr-4 py-1.5 w-full h-9"
                placeholder="Search shop admins by name, email, or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="ml-3 px-12 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center h-9 min-w-[100px]"
              onClick={() => {/* Search functionality already handled by onChange */}}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="card p-0 bg-gray-50 border border-gray-200 rounded-lg shadow mb-8 w-full">
        <div className="px-6 pb-6 pt-4">
          <p className="text-base text-gray-700 mb-4">
            All Shop Admins {filteredUsers.length > 0 && `(${filteredUsers.length})`}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-middle font-medium text-gray-900">
                        <ShopNames managedShops={user.managedShops} />
                      </td>
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
                          Change Status
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
              {/* Status section for shop_admin */}
              <div className="text-gray-500 font-medium">Status:</div>
              <div>
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
              </div>
            </div>
            <div className="border-t my-4" />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminShopAdmins;

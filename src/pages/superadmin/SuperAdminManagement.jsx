import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';

const SuperAdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const USERS_PER_PAGE = 10;

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



  // Filter and search super admins
  const filteredUsers = users
    .filter(user => user.role === 'super_admin')
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

  const openModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <PageHeader 
        title="Super Admin Panel"
        subtitle="Manage super administrators"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Super Admin Panel' }
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
                placeholder="Search super admins by name, email, or phone..."
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
            All Super Admins {filteredUsers.length > 0 && `(${filteredUsers.length})`}
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
    </div>
  );
};

export default SuperAdminManagement;

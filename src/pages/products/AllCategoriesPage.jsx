import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import FancyLoader from '../../components/ui/FancyLoader';
import PageHeader from '../../components/ui/PageHeader';
import SearchFilter from '../../components/ui/SearchFilter';
import EmptyState from '../../components/ui/EmptyState';

const AllCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1)
  const CATEGORIES_PER_PAGE = 10

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch categories
        const categoriesResponse = await api.get('/api/categories');
        const categoriesData = categoriesResponse.data || categoriesResponse;
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);

        // Fetch shops for dropdowns
        const usersResponse = await api.get('/api/auth/alluser');
        if (usersResponse && (usersResponse.data || usersResponse)) {
          const allUsers = usersResponse.data || usersResponse;
          const shopAdmins = allUsers.filter(user => user.role === 'shop_admin');
          // Extract unique shops from managedShops
          const shopIds = [...new Set(shopAdmins.flatMap(user => 
            Array.isArray(user.managedShops) ? user.managedShops : []
          ).filter(Boolean))];
          
          // Also extract shop IDs from categories
          const categoryShopIds = [...new Set(categoriesData
            .map(cat => {
              if (typeof cat.shop === 'object' && cat.shop?._id) {
                return cat.shop._id;
              } else if (typeof cat.shop === 'string') {
                return cat.shop;
              }
              return null;
            })
            .filter(Boolean)
          )];
          
          // Combine all shop IDs
          const allShopIds = [...new Set([...shopIds, ...categoryShopIds])];
          
          // Fetch shop details for each shop ID
          const shopDetails = await Promise.all(allShopIds.map(async (shopId) => {
            try {
              const shopData = await api.get(`/api/shops/${typeof shopId === 'object' && shopId._id ? shopId._id : shopId}`);
              const shop = shopData.data || shopData;
              console.log(`Shop ${shopId} data:`, shop); // Debug log
              return shop;
            } catch (error) {
              console.log(`Failed to fetch shop ${shopId}:`, error); // Debug log
              return null;
            }
          }));
          const validShops = shopDetails.filter(shop => shop && shop._id);
          console.log('All fetched shops:', validShops); // Debug log
          setShops(validShops);
        }
      } catch (err) {
        setError('Failed to fetch categories.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get shop name by ID
  const getShopName = (shopRef) => {
    if (!shopRef) return 'N/A';
    
    // If shop is already an object with name
    if (typeof shopRef === 'object' && shopRef !== null) {
      console.log('Shop object:', shopRef); // Debug log
      const shopName = shopRef.name?.en || shopRef.name?.ar || shopRef.name || shopRef.shopName;
      if (shopName) return shopName;
      return `Shop ${shopRef._id || 'Unknown'}`;
    }
    
    // If shop is just an ID, look it up in shops array
    const shop = shops.find(s => s._id === shopRef);
    if (shop) {
      console.log(`Found shop for ID ${shopRef}:`, shop); // Debug log
      const shopName = shop.name?.en || shop.name?.ar || shop.name || shop.shopName || shop.businessName;
      if (shopName) return shopName;
      return `Shop ${shop._id}`;
    }
    
    console.log(`Shop not found for ID: ${shopRef}, available shops:`, shops.map(s => ({id: s._id, name: s.name}))); // Debug log
    // If not found in shops array, return formatted ID
    return `Shop ${shopRef}`;
  };

  // Handle search and filter
  const handleSearch = (query, filters) => {
    let results = [...categories]

    // Search by name and description
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(category => {
        const name = typeof category.name === 'object' ? (category.name.en || category.name.ar || '') : (category.name || '');
        const descEn = category.description?.en || '';
        const descAr = category.description?.ar || '';
        return (
          name.toLowerCase().includes(lowerQuery) ||
          descEn.toLowerCase().includes(lowerQuery) ||
          descAr.toLowerCase().includes(lowerQuery)
        );
      })
    }

    // Apply filters
    if (filters.status) {
      results = results.filter(category => 
        category.status && category.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.shop) {
      results = results.filter(category => {
        if (typeof category.shop === 'object' && category.shop !== null) {
          return category.shop?._id === filters.shop;
        }
        return category.shop === filters.shop;
      });
    }
    
    setFilteredCategories(results)
  }

  const handleClearFilters = () => {
    setFilteredCategories(categories); // Show all categories
  };

  // Filter configurations
  const filterOptions = [
    {
      name: 'shop',
      label: 'Shop',
      type: 'select',
      options: shops
        .map(s => ({ value: s._id, label: s.name?.en || s.name || s._id || 'N/A' })),
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Hidden', label: 'Hidden' },
        { value: 'Inactive', label: 'Inactive' },
      ]
    }
  ]

  // Calculate paginated categories
  const totalPages = Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE)
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * CATEGORIES_PER_PAGE, currentPage * CATEGORIES_PER_PAGE)

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredCategories])

  return (
    <div>
      <PageHeader 
        title="All Categories (Super Admin)"
        subtitle="Manage all categories across all shops"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'All Categories' }
        ]}
      />
      
      {/* Filters and Search */}
      <div className="card mb-6">
        <SearchFilter 
          onSearch={handleSearch}
          onClear={handleClearFilters}
          placeholder="Search categories by name or description..."
          filters={filterOptions}
        />
      </div>
      
      {/* Categories List */}
      <div className="card">
        {loading ? (
          // Loading State
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          // Empty State
          <EmptyState
            title="No categories found"
            description="No categories found. They will appear here once created."
            icon="📂"
          />
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description (EN)</th>
                  <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description (AR)</th>
                  <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          src={category.image || '/default-image.png'} 
                          alt={category.name?.en || category.name || 'Category'} 
                          className="h-10 w-10 rounded object-cover border border-gray-200" 
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 truncate" title={typeof category.name === 'object' ? (category.name?.en || category.name?.ar || 'N/A') : (category.name || 'N/A')}>
                        {typeof category.name === 'object' ? (category.name?.en || category.name?.ar || 'N/A') : (category.name || 'N/A')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500 truncate" title={getShopName(category.shop)}>
                        {getShopName(category.shop)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-500 truncate" title={category.description?.en || 'N/A'}>
                        {category.description?.en ? (category.description.en.length > 30 ? category.description.en.substring(0, 30) + '...' : category.description.en) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-500 truncate" title={category.description?.ar || 'N/A'}>
                        {category.description?.ar ? (category.description.ar.length > 30 ? category.description.ar.substring(0, 30) + '...' : category.description.ar) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {filteredCategories.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * CATEGORIES_PER_PAGE + 1)}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * CATEGORIES_PER_PAGE, filteredCategories.length)}</span> of{' '}
              <span className="font-medium">{filteredCategories.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                className="btn btn-secondary"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCategoriesPage;
import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import FancyLoader from '../../components/ui/FancyLoader';

const AllCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const statusTabs = ['All', 'Active', 'Hidden'];
  const [currentPage, setCurrentPage] = useState(1)
  const CATEGORIES_PER_PAGE = 10

  useEffect(() => {
    api.get('/api/categories')
      .then((data) => {
        setCategories(data.data || data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch categories.');
        setLoading(false);
      });
  }, []);

  // Filter categories by tab and search
  const filteredCategories = (activeTab === 'All' ? categories : categories.filter(cat => (cat.status || '').toLowerCase() === activeTab.toLowerCase()))
    .filter(cat => {
      const name = typeof cat.name === 'object' ? (cat.name.en || cat.name.ar || '') : (cat.name || '');
      const descEn = cat.description?.en || '';
      const descAr = cat.description?.ar || '';
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        descEn.toLowerCase().includes(search.toLowerCase()) ||
        descAr.toLowerCase().includes(search.toLowerCase())
      );
    });

  const totalPages = Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE)
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * CATEGORIES_PER_PAGE, currentPage * CATEGORIES_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab])

  return (
    <div className="lg:p-8">
      <h1 className="text-2xl font-bold mb-6">All Categories (Super Admin)</h1>
      <div className="flex gap-4 mb-6 border-b">
        {statusTabs.map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${activeTab === tab ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-primary-600'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <input
          type="text"
          className="form-input w-full max-w-xs"
          placeholder="Search categories by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          disabled={loading}
        />
      </div>
      {loading ? (
        <FancyLoader />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="card min-h-[350px] shadow border border-gray-100 overflow-x-auto w-full">
          <table className="w-full min-w-0 md:min-w-[700px] divide-y divide-gray-200 whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Description (EN)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Description (AR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCategories.map((cat, idx) => (
                <tr key={cat._id} className="hover:bg-gray-50 transition">
                  <td className="px-2 md:px-6 py-2 md:py-4 align-middle">
                    <img src={cat.image || '/default-image.png'} alt={cat.name?.en || cat.name || 'Category'} className="h-12 w-12 rounded object-cover border" />
                  </td>
                  <td className="px-2 md:px-6 py-2 md:py-4 align-middle font-bold text-gray-900 text-base">{cat.name?.en || cat.name}</td>
                  <td className="px-2 md:px-6 py-2 md:py-4 align-middle max-w-[200px] min-w-[120px] w-24">
                    <div className="relative group">
                      <span className="block truncate line-clamp-2 cursor-pointer" title={cat.description?.en || ''}>{cat.description?.en || ''}</span>
                      {cat.description?.en && (
                        <div className="absolute left-1/2 z-20 hidden group-hover:block bg-white shadow-lg rounded p-4 min-w-[250px] max-w-xs -translate-x-1/2 top-8 border">
                          <div className="text-sm text-gray-800 whitespace-pre-line">{cat.description.en}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 md:px-6 py-2 md:py-4 align-middle max-w-[200px] min-w-[120px] w-24">
                    <div className="relative group">
                      <span className="block truncate line-clamp-2 cursor-pointer" title={cat.description?.ar || ''}>{cat.description?.ar || ''}</span>
                      {cat.description?.ar && (
                        <div className="absolute left-1/2 z-20 hidden group-hover:block bg-white shadow-lg rounded p-4 min-w-[250px] max-w-xs -translate-x-1/2 top-8 border">
                          <div className="text-sm text-gray-800 whitespace-pre-line">{cat.description.ar}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 md:px-6 py-2 md:py-4 align-middle">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cat.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cat.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between px-2 md:px-6 py-4 border-t border-gray-100">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredCategories.length === 0 ? 0 : ((currentPage - 1) * CATEGORIES_PER_PAGE + 1)}</span> to <span className="font-medium">{Math.min(currentPage * CATEGORIES_PER_PAGE, filteredCategories.length)}</span> of <span className="font-medium">{filteredCategories.length}</span> results
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
  );
};

export default AllCategoriesPage;
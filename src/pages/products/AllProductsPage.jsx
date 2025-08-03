import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import FancyLoader from '../../components/ui/FancyLoader';

const statusTabs = ['All', 'Active', 'Out of stock', 'Low stock', 'Hidden', 'Draft'];

const AllProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 10

  useEffect(() => {
    api.get('/api/products')
      .then((data) => {
        setProducts(data.data || data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch products.');
        setLoading(false);
      });
  }, []);

  // Filter products by status tab and search
  const filteredProducts = products
    .filter(product => {
      if (activeTab === 'All') return true;
      const status = (product.status || '').toLowerCase();
      if (activeTab === 'Active') return status === 'active';
      if (activeTab === 'Out of stock') return status === 'out_of_stock' || status === 'out of stock';
      if (activeTab === 'Low stock') return status === 'low_stock' || status === 'low stock';
      if (activeTab === 'Hidden') return status === 'hidden';
      if (activeTab === 'Draft') return status === 'draft';
      return true;
    })
    .filter(product => {
      const name = typeof product.name === 'object' ? (product.name.en || product.name.ar || '') : (product.name || '');
      const category = product.category?.name?.en || product.category?.name || product.category || '';
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        category.toLowerCase().includes(search.toLowerCase())
      );
    });

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab])

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">All Products (Super Admin)</h1>
      {/* Horizontally scrollable tabs */}
      <div className="flex gap-4 mb-6 border-b overflow-x-auto flex-nowrap pb-1 -mx-2 px-2">
        {statusTabs.map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 whitespace-nowrap ${activeTab === tab ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-primary-600'}`}
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
          placeholder="Search products by name or category..."
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
        <div className="card bg-white p-0 overflow-x-auto">
          <div className="px-2 md:px-6 pt-6 pb-2 min-w-[600px]">
            <div className="flex text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
              <div className="w-1/4 min-w-[120px]">Product</div>
              <div className="w-1/5 min-w-[100px]">Category</div>
              <div className="w-1/5 min-w-[80px]">Price</div>
              <div className="w-1/5 min-w-[80px]">Stock</div>
              <div className="w-1/5 min-w-[90px] flex items-center justify-center max-w-[120px]">Status</div>
            </div>
            {paginatedProducts.map((product, idx) => (
              <div key={product._id} className={`flex items-center py-4 ${idx !== paginatedProducts.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition`}>
                <div className="w-1/4 min-w-[120px] flex items-center gap-3">
                  {product.baseImage && product.baseImage.length > 0 ? (
                    <img src={product.baseImage[0]} alt={typeof product.name === 'object' ? (product.name.en || product.name.ar) : product.name} className="h-10 w-10 rounded object-cover bg-gray-100" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">N/A</div>
                  )}
                  <span className="font-medium text-gray-900 truncate">{typeof product.name === 'object' ? product.name.en || product.name.ar : product.name}</span>
                </div>
                <div className="w-1/5 min-w-[100px] text-gray-700 flex items-center h-full">{product.category?.name?.en || product.category?.name || product.category || '-'}</div>
                <div className="w-1/5 min-w-[80px] font-bold flex items-center h-full">{product.variants && product.variants[0] ? product.variants[0].price : 'N/A'}</div>
                <div className="w-1/5 min-w-[80px] text-gray flex items-center h-full">{product.variants && product.variants[0].stock ? product.variants[0].stock : 'N/A'}</div>
                <div className="w-1/5 min-w-[90px] flex items-center justify-center max-w-[120px] h-full">
                  {product.status === 'active' ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                  ) : product.status === 'low_stock' ? (
                    <span className="bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-semibold">Low stock</span>
                  ) : product.status === 'out_of_stock' ? (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Out of Stock</span>
                  ) : (
                    <span className={`badge ${
                      (product.status ? product.status : (typeof product.stock === 'number' && product.stock === 0 ? 'Out of Stock' : typeof product.stock === 'number' && product.stock <= 10 ? 'Low Stock' : 'Active')) === 'Active' ? 'badge-success' :
                      (product.status ? product.status : (typeof product.stock === 'number' && product.stock === 0 ? 'Out of Stock' : typeof product.stock === 'number' && product.stock <= 10 ? 'Low Stock' : 'Active')) === 'Out of Stock' ? 'badge-error' :
                      (product.status ? product.status : (typeof product.stock === 'number' && product.stock <= 10 ? 'Low Stock' : 'Active')) === 'Low Stock' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {product.status ? product.status : (typeof product.stock === 'number' && product.stock === 0 ? 'Out of Stock' : typeof product.stock === 'number' && product.stock <= 10 ? 'Low Stock' : 'Active')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-2 md:px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredProducts.length === 0 ? 0 : ((currentPage - 1) * PRODUCTS_PER_PAGE + 1)}</span> to <span className="font-medium">{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> results
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
      )}
    </div>
  );
};

export default AllProductsPage;
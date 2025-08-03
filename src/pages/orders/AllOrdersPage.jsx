import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import FancyLoader from '../../components/ui/FancyLoader';

const AllOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [search, setSearch] = useState('');
  const statusTabs = ['All Orders',"Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled", "Refunded"];
  const [currentPage, setCurrentPage] = useState(1)
  const ORDERS_PER_PAGE = 10

  useEffect(() => {
    api.get('/api/orders')
      .then((data) => {
        setOrders(data.data || data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch orders.');
        setLoading(false);
      });
  }, []);

  // Filter orders by tab and search
  const filteredOrders = (activeTab === 'All Orders' ? orders : orders.filter(order => (order.status || '').toLowerCase() === activeTab.toLowerCase()))
    .filter(order => {
      const orderId = order._id || '';
      const customerName = order.user?.name || '';
      const customerEmail = order.user?.email || '';
      return (
        orderId.toLowerCase().includes(search.toLowerCase()) ||
        customerName.toLowerCase().includes(search.toLowerCase()) ||
        customerEmail.toLowerCase().includes(search.toLowerCase())
      );
    });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab])

  return (
    <div className="lg:p-8">
      <h1 className="text-2xl font-bold mb-6">All Orders (Super Admin)</h1>
      <div className="flex gap-6 mb-4 border-b border-gray-200">
        {statusTabs.map(tab => (
          <button
            key={tab}
            className={`pb-2 text-base font-medium transition-colors duration-150 ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-500 hover:text-primary-600'}`}
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
          placeholder="Search orders by ID, customer name, or email..."
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
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto w-full">
          <table className="w-full min-w-0 md:min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Products</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Total( QAR )</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => (
                <tr key={order._id}>
                  <td className="px-2 md:px-4 py-2 md:py-4">
                    <div className="flex items-center gap-1">
                      {order.items && order.items.length > 0 ? (
                        <>
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                              {item.product?.baseImage && Array.isArray(item.product.baseImage) && item.product.baseImage.length > 0 ? (
                                <img
                                  src={item.product.baseImage[0]}
                                  alt={typeof item.product.name === 'object' ? (item.product.name?.en || item.product.name?.ar || 'Product') : (item.product.name || 'Product')}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <span className="ml-1 text-xs bg-gray-200 rounded-full px-2 py-1 text-gray-700">+{order.items.length - 2}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">No products</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{order.user?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{order.user?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-4">
                    <div>
                      <p className="text-sm text-gray-900">{order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}</p>
                      <p className="text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</p>
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-4 text-right font-bold">{order.pricing?.totalAmount ? order.pricing.totalAmount : '0.00'}</td>
                  <td className="px-2 md:px-4 py-2 md:py-4 text-center">{order.items?.length || 0}</td>
                  <td className="px-4 py-4 text-sm text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'preparing' ? 'bg-indigo-100 text-indigo-700' :
                      order.status === 'ready' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      order.status === 'refunded' ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between px-2 md:px-6 py-4 border-t border-gray-100">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredOrders.length === 0 ? 0 : ((currentPage - 1) * ORDERS_PER_PAGE + 1)}</span> to <span className="font-medium">{Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)}</span> of <span className="font-medium">{filteredOrders.length}</span> results
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

export default AllOrdersPage;
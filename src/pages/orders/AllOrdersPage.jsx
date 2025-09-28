import React, { useEffect, useState } from 'react';
import * as api from '../../utils/api';
import FancyLoader from '../../components/ui/FancyLoader';
import OrderDetailsModal from './OrderDetailsModal';
import { FiSearch } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';

const AllOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [search, setSearch] = useState('');
  const statusTabs = ['All Orders',"Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled", "Refunded"];
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const ORDERS_PER_PAGE = 10;

  useEffect(() => {
    api.get('/api/orders')
      .then((data) => {
        // Sort orders by createdAt in descending order (newest first)
        const sortedOrders = (data.data || data).sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // Sort in descending order (newest first)
        });
        setOrders(sortedOrders);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch orders.');
        setLoading(false);
      });
  }, []);

  // Filter orders by tab and search
  const filteredOrders = (activeTab === 'All Orders' 
    ? [...orders] 
    : orders.filter(order => (order.status || '').toLowerCase() === activeTab.toLowerCase())
  ).filter(order => {
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
    <div className="p-4 max-w-full overflow-x-auto">
      <PageHeader 
        title="All Orders"
        subtitle="Manage all orders across all shops"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'All Orders' }
        ]}
      />

      {/* Status Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
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

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="p-2">
          <div className="relative w-full flex">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                className="form-input pl-9 pr-4 py-1.5 w-full h-9"
                placeholder="Search orders by ID, customer name, or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              className="ml-3 px-12 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center h-9 disabled:opacity-50 min-w-[100px]"
              onClick={() => {/* Search functionality already handled by onChange */}}
              disabled={loading}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      {/* Orders Table */}
      <div className="card w-full">
        {loading ? (
          <FancyLoader />
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Products</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Total (QAR)</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => (
                <tr 
                  key={order._id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedOrderId(order._id)}
                >
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
                      <p className="text-xs text-gray-500" title={order.user?.email || '-'}>
                        {order.user?.email ? 
                          (order.user.email.length > 15 ? `${order.user.email.substring(0, 15)}...` : order.user.email) 
                          : '-'
                        }
                      </p>
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {order.createdAt ? 
                          `${new Date(order.createdAt).getDate()} ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short' })} ${new Date(order.createdAt).getFullYear()}`
                          : '-'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt ? 
                          new Date(order.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: true 
                          }).toLowerCase()
                          : '-'
                        }
                      </p>
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-4 text-right font-bold">{order.pricing?.totalAmount ? order.pricing.totalAmount : '0.00'}</td>
                  <td className="px-2 md:px-4 py-2 md:py-4 text-center">{order.items?.length || 0}</td>
                  <td className="px-4 py-4 text-sm text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
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
                      {order.status === 'delivered' ? 'Delivered in 48 Hours' : order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
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
          </>
        )}
      </div>
      
      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={() => {
            // Refresh orders when status is updated
            api.get('/api/orders')
              .then((data) => {
                const sortedOrders = (data.data || data).sort((a, b) => {
                  const dateA = new Date(a.createdAt || 0);
                  const dateB = new Date(b.createdAt || 0);
                  return dateB - dateA;
                });
                setOrders(sortedOrders);
              });
          }}
        />
      )}
    </div>
  );
};

export default AllOrdersPage;
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  FiPackage, 
  FiFilter, 
  FiDownload,
  FiEye,
  FiTruck,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiShoppingBag
} from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import SearchFilter from '../../components/ui/SearchFilter'
import EmptyState from '../../components/ui/EmptyState'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import * as api from '../../utils/api' // Import API utility
import { useAuth } from '../../contexts/AuthContext'
import OrderDetailsModal from './OrderDetailsModal'

const OrderList = () => {
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [error, setError] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ORDERS_PER_PAGE = 30
  
  // Check if user is a worker (read-only access)
  const isWorker = currentUser?.role === 'worker';
  
  // Get status from URL params
  const statusParam = searchParams.get('status')

  // Fetch orders for the current user's shop only
  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let shopId;
      
      // For workers, use assignedShop
      if (isWorker) {
        shopId = currentUser?.assignedShop?._id || currentUser?.assignedShop;
      } else {
        // For shop admins, use managedShops
        shopId = currentUser?.managedShops[0]?._id || (Array.isArray(currentUser?.managedShop) ? currentUser.managedShop[0] : null);
      }
      
      if (!shopId) {
        setOrders([])
        setFilteredOrders([])
        if (isWorker) {
          setError('No shop assigned to this worker.')
        } else {
          setError('No shop found for this user.')
        }
        setIsLoading(false)
        return
      }
      
      const data = await api.get('/api/orders')
      // Filter orders for this shop
      const allOrders = Array.isArray(data) ? data : (data.data || [])
     // reverse the orders 
     
     const shopOrders = allOrders.filter(
      order => order.shop === shopId || order.shop?._id === shopId
    )
    const reversedOrders = [...shopOrders].reverse()
    setOrders(reversedOrders)
    if (statusParam) {
      const normalizedStatusParam = statusParam.toLowerCase()
      setFilteredOrders(reversedOrders.filter(order => order.status.toLowerCase() === normalizedStatusParam))
    } else {
      setFilteredOrders(reversedOrders)
    }
    } catch (err) {
      setOrders([])
      setFilteredOrders([])
      setError(err)
      toast.error(err.response?.data?.message || 'Failed to fetch orders.')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line
  }, [statusParam, currentUser])
  
  // Handle search and filter
  const handleSearch = (query, filters) => {
    let results = [...orders] // Start with all orders
    
    // Search by order ID, customer name, or email
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(order => 
        order._id.toLowerCase().includes(lowerQuery) || 
        (order.user?.name && order.user.name.toLowerCase().includes(lowerQuery)) ||
        (order.user?.email && order.user.email.toLowerCase().includes(lowerQuery))
      )
    }
    
    // Apply status filter from SearchFilter component
    if (filters.status) {
      results = results.filter(order => order.status === filters.status)
    }
    
    // Apply payment filter (Note: paymentStatus is not directly in OrderSchema, this might need adjustment)
    // If paymentStatus is derived or part of a populated field, adjust access accordingly.
    // For now, this filter might not work as expected if `order.paymentStatus` is not available.
    if (filters.paymentStatus) { 
      results = results.filter(order => order.paymentStatus === filters.paymentStatus) 
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      results = results.filter(order => new Date(order.createdAt) >= fromDate)
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of the day
      results = results.filter(order => new Date(order.createdAt) <= toDate)
    }
    
    if (filters.minTotal) {
      results = results.filter(order => 
        order.pricing && typeof order.pricing.totalAmount === 'number' && order.pricing.totalAmount >= parseFloat(filters.minTotal)
      );
    }
    
    if (filters.maxTotal) {
      results = results.filter(order => 
        order.pricing && typeof order.pricing.totalAmount === 'number' && order.pricing.totalAmount <= parseFloat(filters.maxTotal)
      );
    }
    
    setFilteredOrders(results)
  }
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(order => order._id)) // Use _id
    }
    setSelectAll(!selectAll)
  }
  
  // Handle individual select
  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
      setSelectAll(false)
    } else {
      setSelectedOrders([...selectedOrders, orderId])
      if (selectedOrders.length + 1 === filteredOrders.length) {
        setSelectAll(true)
      }
    }
  }
  
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected')
      return
    }
    
    let newStatus = ''
    let message = ''

    switch (action) {
      case 'process': newStatus = 'Processing'; break;
      case 'ship': newStatus = 'Shipped'; break;
      case 'deliver': newStatus = 'Delivered'; break;
      case 'cancel': newStatus = 'Cancelled'; break;
      default:
        toast.error('Invalid action')
        return;
    }

    message = `${selectedOrders.length} orders marked as ${newStatus.toLowerCase()}`
    
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        selectedOrders.map(orderId => api.put(`/orders/${orderId}/status`, { status: newStatus }))
      )
      toast.success(message)
      fetchOrders() // Refresh the list
    } catch (err) {
      console.error(`Failed to update orders to ${newStatus}:`, err)
      toast.error(err.response?.data?.message || `Failed to update orders.`)
    } finally {
      setIsBulkUpdating(false)
      setSelectedOrders([])
      setSelectAll(false)
    }
  }
  
  // Filter configurations - adjust 'payment' to 'paymentStatus' if that's the intended field name
  const filterOptions = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'preparing', label: 'Preparing' },
        { value: 'ready', label: 'Ready' },
        { value: 'Out for Delivery', label: 'Out for Delivery' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
      ]
    },
    // { // Removing payment filter as it's not directly in OrderSchema
    //   name: 'paymentStatus', 
    //   label: 'Payment Status',
    //   type: 'select',
    //   options: [
    //     { value: 'Paid', label: 'Paid' },
    //     { value: 'Pending', label: 'Pending' },
    //     { value: 'Failed', label: 'Failed' },
    //     { value: 'Refunded', label: 'Refunded' },
    //   ]
    // },
    {
      name: 'dateFrom',
      label: 'Date From',
      type: 'date',
    },
    {
      name: 'dateTo',
      label: 'Date To',
      type: 'date',
    },
    {
      name: 'minTotal',
      label: 'Min Total',
      type: 'number',
      placeholder: '0.00',
    },
    {
      name: 'maxTotal',
      label: 'Max Total',
      type: 'number',
      placeholder: '1000.00',
    }
  ]
  
  // Status badge color mapping
  const statusColors = {
    'Pending': 'badge-warning',
    'Processing': 'badge-info',
    'Shipped': 'badge-info',
    'Delivered': 'badge-success',
    'Cancelled': 'bg-red-500',
  }

  // Calculate paginated orders
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE)

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredOrders])
  
  const handleClearFilters = () => {
    setFilteredOrders(orders); // Show all orders
    // Optionally, reset any local filter/search state if you have it
  };
  
  return (
    <div>
      <PageHeader 
        title="Orders"
        subtitle="Manage and track your orders"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Orders' }
        ]}
      />
      
      {/* Filters */}
      <div className="card mb-6">
        <SearchFilter 
          onSearch={handleSearch}
          onClear={handleClearFilters}
          placeholder="Search orders by ID, customer name, or email..."
          filters={filterOptions}
        />
      </div>
      
      {/* Bulk Actions - Only for non-workers */}
      {!isWorker && selectedOrders.length > 0 && (
        <div className="flex items-center mb-4 p-3 bg-primary-50 rounded-md animate-fade-in">
          <span className="text-sm font-medium text-primary-700 mr-4">
            {selectedOrders.length} orders selected
          </span>
          <div className="space-x-2">
            <button 
              onClick={() => handleBulkAction('process')}
              className="btn btn-warning text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : null} Process
            </button>
            <button 
              onClick={() => handleBulkAction('ship')}
              className="btn btn-info text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : <FiTruck className="mr-1 h-4 w-4" />} Ship
            </button>
            <button 
              onClick={() => handleBulkAction('deliver')}
              className="btn btn-success text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : null} Mark Delivered
            </button>
            <button 
              onClick={() => handleBulkAction('cancel')}
              className="btn btn-danger text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : <FiX className="mr-1 h-4 w-4" />}
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Orders List */}
      <div className="card">
        {isLoading ? (
          // Loading State
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          // Empty State
          <EmptyState 
            title="No orders found"
            description={
              statusParam 
                ? `No orders with status "${statusParam}" found.` 
                : "No orders found. They will appear here once customers place orders."
            }
            icon={<FiPackage className="h-8 w-8" />}
          />
        ) : (
          // Orders Table
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Products</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right text-nowrap">Total( QAR )</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  {isWorker && <th className="px-4 py-3 text-right align-bottom">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {order.items && order.items.length > 0 ? (
                          <>
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                                {item.product?.baseImage && Array.isArray(item.product.baseImage) && item.product.baseImage.length > 0 ? (
                                  <img
                                    src={item.product.baseImage[0]}
                                    alt={typeof item.product.name === 'object' ? (item.product.name?.en || item.product.name?.ar || 'Product') : (item.product.name || 'Product')}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                ) : (
                                  <FiShoppingBag className="h-5 w-5" />
                                )}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <span className="ml-1 text-xs bg-gray-200 rounded-full px-2 py-1 text-gray-700">
                                +{order.items.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">No products</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{order.user?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.user?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-gray-900 text-nowrap">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'hh:mm a')}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                      {order.pricing?.totalAmount ? (order.pricing.totalAmount ) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      {order.items?.length || 0}
                    </td>
                    <td className="px-4 py-4 text-sm">
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
                    {isWorker && (
                      <td className="px-4 py-4 text-sm font-medium">
                        <div className="flex items-center justify-center h-full w-full">
                          <button
                            onClick={() => { setSelectedOrderId(order._id); setShowOrderModal(true); }}
                            className="text-primary-600 hover:text-primary-900 flex justify-center items-center"
                          >
                            <FiEye className="h-5 w-5 cursor-pointer" title="View Order Details" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredOrders.length === 0 ? 0 : ((currentPage - 1) * ORDERS_PER_PAGE + 1)}</span> to <span className="font-medium">{Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)}</span> of{" "}
                  <span className="font-medium">{filteredOrders.length}</span> results
                </p>
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
      {/* Order Details Modal - Only for non-workers */}
      {isWorker && showOrderModal && selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => { setShowOrderModal(false); setSelectedOrderId(null); }}
          onStatusUpdated={fetchOrders}
        />
      )}
    </div>
  )
}

export default OrderList
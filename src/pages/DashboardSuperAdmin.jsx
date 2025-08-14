import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import { TbCurrencyRiyal } from "react-icons/tb";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { format } from "date-fns";
import * as api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

const DashboardSuperAdmin = () => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [salesRange, setSalesRange] = useState("Last 7 days");

  // Helper function to get display name from multilingual object
  const getDisplayName = (name) => {
    if (!name) return "Product";
    if (typeof name === "string") return name;
    if (typeof name === "object") return name.en || name.ar || "Product";
    return "Product";
  };

  // Helper function to get category name
  const getCategoryName = (category) => {
    if (!category) return "Other";
    if (typeof category === "string") return category;
    if (typeof category === "object") return getDisplayName(category.name);
    return "Other";
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all in parallel
        const [
          productsResponse,
          ordersResponse,
          usersResponse,
          categoriesResponse,
        ] = await Promise.all([
          api.get("/api/products"),
          api.get("/api/orders"),
          api.get("/api/auth/alluser"),
          api.get("/api/categories"),
        ]);
        const allProducts = productsResponse.data || productsResponse;
        setProducts(allProducts);
        const allOrders = ordersResponse.data || ordersResponse;
        setOrders(allOrders);
        const allUsers = usersResponse.data || usersResponse;
        setUsers(allUsers);
        const allCategories = categoriesResponse.data || categoriesResponse;
        setCategories(allCategories);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to fetch dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate real statistics
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.pricing?.totalAmount || 0);
  }, 0);

  // Total products, orders, customers
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalCustomers = Array.isArray(users)
    ? users.filter((u) => u.role === "customer").length
    : 0;

  // Format currency with K, M, B convention
  const formatCurrency = (amount) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B QAR`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M QAR`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K QAR`;
    } else {
      return `${amount.toFixed(2)} QAR`;
    }
  };

  // Unique customers across all orders
  // const uniqueCustomers = new Set(
  //   orders.map(order =>
  //     order.user?.email ||
  //     order.user?.name ||
  //     order.user?.fullName ||
  //     order.customer?.email ||
  //     order.customer?.name ||
  //     order.customer?.fullName ||
  //     order.user ||
  //     order.customer ||
  //     order.userId ||
  //     order.customerId
  //   )
  // ).size;

  // Get recent orders (last 5)
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((order) => ({
      id: order._id,
      customer:
        order.user?.name ||
        order.user?.fullName ||
        order.customer?.name ||
        order.customer?.fullName ||
        (order.user && typeof order.user === "string" ? order.user : null) ||
        (order.customer && typeof order.customer === "string"
          ? order.customer
          : null) ||
        order.userName ||
        order.customerName ||
        "Customer",
      total: formatCurrency(order.pricing?.totalAmount || 0),
      date: new Date(order.createdAt),
      status: order.status || "Pending",
    }));

  // Calculate category distribution for products using all categories
  const categoryCounts = {};
  categories.forEach((category) => {
    // Count how many products belong to this category
    const count = products.filter((product) => {
      // product.category can be string (id) or object
      if (!product.category) return false;
      if (typeof product.category === "string") {
        return product.category === category._id;
      }
      if (typeof product.category === "object" && product.category._id) {
        return product.category._id === category._id;
      }
      return false;
    }).length;
    categoryCounts[category.name?.en || category.name || "Other"] = count;
  });

  const categoryLabels = Object.keys(categoryCounts);
  const categoryValues = Object.values(categoryCounts);

  // Generate sales data based on selected range
  const generateSalesData = () => {
    let labels = [];
    let sales = [];
    const now = new Date();

    if (salesRange === "Last 7 days") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
        );
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        const daySales = orders
          .filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= dayStart && orderDate <= dayEnd;
          })
          .reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0);
        sales.push(daySales);
      }
    } else if (salesRange === "Last 30 days") {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
        );
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        const daySales = orders
          .filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= dayStart && orderDate <= dayEnd;
          })
          .reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0);
        sales.push(daySales);
      }
    } else if (salesRange === "Last 3 months") {
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        );
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        const monthSales = orders
          .filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= monthStart && orderDate <= monthEnd;
          })
          .reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0);
        sales.push(monthSales);
      }
    } else if (salesRange === "Last year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        );
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        const monthSales = orders
          .filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= monthStart && orderDate <= monthEnd;
          })
          .reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0);
        sales.push(monthSales);
      }
    }
    return { labels, sales };
  };

  const { labels: months, sales } = generateSalesData();
  const salesData = {
    labels: months,
    datasets: [
      {
        label: "Sales",
        data: sales,
        fill: true,
        backgroundColor: "rgba(0, 102, 204, 0.1)",
        borderColor: "rgba(0, 102, 204, 0.7)",
        tension: 0.4,
      },
    ],
  };

  // Product categories data for doughnut chart
  const categoryData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ["No Categories"],
    datasets: [
      {
        data: categoryValues.length > 0 ? categoryValues : [1],
        backgroundColor: [
          "#0066CC",
          "#FF9500",
          "#34C759",
          "#5856D6",
          "#FF3B30",
          "#AF52DE",
          "#FF9500",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Get low stock items from products that have status as "Low Stock"
  const lowStockItems = products
    .filter((product) => product.status === "Low Stock")
    .map((product) => ({
      id: product._id,
      name: getDisplayName(product.name),
      stock:
        product.variants?.reduce(
          (sum, variant) => sum + (variant.stock || 0),
          0
        ) ||
        product.stock ||
        0,
      category: getCategoryName(product.category),
    }));

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#f0f0f0",
          drawBorder: false,
        },
        title: {
          display: true,
          text: "Revenue",
          font: {
            size: 12,
          },
          color: "#666",
        },
        ticks: {
          callback: (value) => {
            if (value >= 1000000000)
              return (value / 1000000000).toFixed(1) + "B";
            if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
            if (value >= 1000) return (value / 1000).toFixed(1) + "K";
            return value;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
        borderColor: "#0066CC",
        backgroundColor: "rgba(0, 102, 204, 0.1)",
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: "#fff",
        borderColor: "#0066CC",
        borderWidth: 2,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
    },
    cutout: "70%",
  };

  // Loading UI
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No user found
  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No User Found
          </h3>
          <p className="text-gray-600 mb-4">
            Please log in to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Status badge color mapping
  // const statusColors = {
  //   'Delivered': 'badge-success',
  //   'Shipped': 'badge-info',
  //   'Processing': 'badge-warning',
  //   'Pending': 'badge-error',
  // }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview of your store"
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Products"
          value={totalProducts || "0"}
          icon={<FiShoppingBag className="h-5 w-5 text-primary-500" />}
          // change="+8% from last month"
          changeType="positive"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders || "0"}
          icon={<FiPackage className="h-5 w-5 text-primary-500" />}
          // change="+12% from last month"
          changeType="positive"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<TbCurrencyRiyal className="h-fit w-5 text-primary-500" />}
          // change="-3% from last month"
          changeType="negative"
        />
        <StatCard
          title="Customers"
          value={totalCustomers || "0"}
          icon={<FiUsers className="h-5 w-5 text-primary-500" />}
          // change="+5% from last month"
          changeType="positive"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <div className="card bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Sales Overview
              </h3>
              <select
                className="form-select rounded-md border-gray-200 text-sm"
                value={salesRange}
                onChange={(e) => setSalesRange(e.target.value)}
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Last year</option>
              </select>
            </div>
            <div className="h-72">
              <Line data={salesData} options={lineChartOptions} />
            </div>
            <div className="mt-4 flex justify-center text-xs text-gray-500">
              <div className="flex items-center gap-6">
                <span>B: Billion</span>
                <span>M: Million</span>
                <span>K: Thousand</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Chart */}
        <div>
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Product Categories
            </h3>
            <div className="h-72 flex items-center justify-center">
              <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Orders
              </h3>
              <Link
                to="/all-orders"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <p className="text-primary-600 hover:text-primary-700">
                            {order.id}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {order.customer}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {format(order.date, "MMM dd, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {order.total}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : order.status === "confirmed"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "preparing"
                                ? "bg-indigo-100 text-indigo-700"
                                : order.status === "ready"
                                ? "bg-purple-100 text-purple-700"
                                : order.status === "Out for Delivery"
                                ? "bg-orange-100 text-orange-700"
                                : order.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : order.status === "refunded"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div>
          <div className="bg-red-50 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-xl text-red-500 font-medium">
                  Low Stock Items{" "}
                  {lowStockItems.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-500 text-sm rounded-md">
                      {lowStockItems.length}
                    </span>
                  )}
                </h3>
              </div>
              <Link
                to="/all-products"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500">No items with low stock.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FiAlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-base font-medium text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="px-3 py-1 bg-red-100 text-red-500 rounded-full text-sm">
                          {item.stock} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {lowStockItems.length > 3 && (
                  <Link
                    to="/all-products"
                    className="mt-4 block text-center text-red-500 hover:text-red-600 font-medium"
                  >
                    View all {lowStockItems.length} low stock items
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSuperAdmin;

// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import DashboardSuperAdmin from "./pages/DashboardSuperAdmin";
import ProductList from "./pages/products/ProductList";
import AddProduct from "./pages/products/AddProduct";
import OrderList from "./pages/orders/OrderList";
import Settings from "./pages/settings/Settings";
// import Help from "./pages/help/Help";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import WorkerSignupPage from "./pages/auth/WorkerSignupPage";
import CartPage from "./pages/cart/CartPage";
import WishlistPage from "./pages/wishlist/WishlistPage";
import Categories from "./pages/products/Categories";
import SuperAdmin from "./pages/superadmin/SuperAdmin";
import SuperAdminCustomers from "./pages/superadmin/SuperAdminCustomers";
import SuperAdminShopAdmins from "./pages/superadmin/SuperAdminShopAdmins";
import SuperAdminManagement from "./pages/superadmin/SuperAdminManagement";
import AllProductsPage from "./pages/AllProductsPage";
import AllCategoriesPage from "./pages/products/AllCategoriesPage";
import AllOrdersPage from "./pages/orders/AllOrdersPage";
import Workers from "./pages/Workers";
import Customers from "./pages/Customers";

function App() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/worker-signup" element={<WorkerSignupPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          {/* Dashboard Routing Logic */}
          <Route
            index
            element={
              <ProtectedRoute
                render={({ user }) => {
                  if (user?.role === "super_admin") {
                    return <Navigate to="/superdashboard" replace />;
                  }
                  if (user?.role === "worker") {
                    return <Navigate to="/orders" replace />;
                  }
                  return <Dashboard />;
                }}
              />
            }
          />

          {/* Products - Only for shop admins */}
          {user?.role !== 'worker' && (
            <Route path="products">
              <Route
                index
                element={
                  <ProtectedRoute requiredRole="shop_admin">
                    <ProductList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add"
                element={
                  <ProtectedRoute requiredRole="shop_admin">
                    <AddProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="categories"
                element={
                  <ProtectedRoute requiredRole="shop_admin">
                    <Categories />
                  </ProtectedRoute>
                }
              />
            </Route>
          )}

          {/* Orders - Accessible to both shop admins and workers */}
          <Route path="orders">
            <Route
              index
              element={
                <ProtectedRoute requiredRoles={["shop_admin", "worker"]}>
                  <OrderList />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Cart - Only for shop admins */}
          {user?.role !== 'worker' && (
            <Route
              path="cart"
              element={
                <ProtectedRoute requiredRole="shop_admin">
                  <CartPage />
                </ProtectedRoute>
              }
            />
          )}

          {/* Wishlist - Only for shop admins */}
          {user?.role !== 'worker' && (
            <Route
              path="wishlist"
              element={
                <ProtectedRoute requiredRole="shop_admin">
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
          )}

          {/* Settings - Only for shop admins */}
          {user?.role !== 'worker' && (
            <Route
              path="settings"
              element={
                <ProtectedRoute requiredRole="shop_admin">
                  <Settings />
                </ProtectedRoute>
              }
            />
          )}

          {/* Super Admin Routes */}
          <Route
            path="superdashboard"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <DashboardSuperAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin/customers"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin/shop-admins"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminShopAdmins />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin/management"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="all-products"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <AllProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="all-categories"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <AllCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="all-orders"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <AllOrdersPage />
              </ProtectedRoute>
            }
          />
          {/* Workers */}
          <Route
            path="workers"
            element={
              <ProtectedRoute requiredRole="shop_admin">
                <Workers />
              </ProtectedRoute>
            }
          />
          <Route
            path="customers"
            element={
              <ProtectedRoute requiredRole="shop_admin">
                <Customers />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Catch-All 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

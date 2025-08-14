// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
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
import AllProductsPage from "./pages/AllProductsPage";
import AllCategoriesPage from "./pages/products/AllCategoriesPage";
import AllOrdersPage from "./pages/orders/AllOrdersPage";
import Workers from "./pages/Workers";

function App() {
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
                  return <Dashboard />;
                }}
              />
            }
          />

          {/* Products */}
          <Route path="products">
            <Route
              index
              element={
                <ProtectedRoute requiredRoles={["shop_admin", "worker"]}>
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
                <ProtectedRoute requiredRoles={["shop_admin", "worker"]}>
                  <Categories />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Orders */}
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

          {/* Cart */}
          <Route
            path="cart"
            element={
              <ProtectedRoute requiredRoles={["shop_admin", "worker"]}>
                <CartPage />
              </ProtectedRoute>
            }
          />

          {/* Wishlist */}
          <Route
            path="wishlist"
            element={
              <ProtectedRoute requiredRoles={["shop_admin", "worker"]}>
                <WishlistPage />
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

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
        </Route>
      </Route>

      {/* Catch-All 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

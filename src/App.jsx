import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import DashboardSuperAdmin from './pages/DashboardSuperAdmin'
import ProductList from './pages/products/ProductList'
import AddProduct from './pages/products/AddProduct'
import OrderList from './pages/orders/OrderList'
import Settings from './pages/settings/Settings'
import Help from './pages/help/Help'
import NotFound from './pages/NotFound'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import CartPage from './pages/cart/CartPage'
import WishlistPage from './pages/wishlist/WishlistPage'
import Categories from './pages/products/Categories'
import SuperAdmin from './pages/superadmin/SuperAdmin'
import AllProductsPage from './pages/products/AllProductsPage'
import AllCategoriesPage from './pages/products/AllCategoriesPage'
import AllOrdersPage from './pages/orders/AllOrdersPage'

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected routes: Layout always wraps, role protection inside */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          {/* Shop Admin/Customer Only */}
          <Route index element={
            <ProtectedRoute requiredRole="shop_admin">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="products" >
            <Route index element={
              <ProtectedRoute requiredRole="shop_admin">
                <ProductList />
              </ProtectedRoute>
            } />
            <Route path="add" element={
              <ProtectedRoute requiredRole="shop_admin">
                <AddProduct />
              </ProtectedRoute>
            } />
            <Route path="categories" element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="orders">
            <Route index element={
              <ProtectedRoute requiredRole="shop_admin">
                <OrderList />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="cart" element={
            <ProtectedRoute requiredRole="shop_admin">
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="wishlist" element={
            <ProtectedRoute requiredRole="shop_admin">
              <WishlistPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          {/* <Route path="help" element={
            <ProtectedRoute requiredRole="shop_admin">
              <Help />
            </ProtectedRoute>
          } /> */}

          {/* Super Admin Only */}
          <Route path="superdashboard" element={
            <ProtectedRoute requiredRole="super_admin">
              <DashboardSuperAdmin />
            </ProtectedRoute>
          } />
          <Route path="superadmin" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdmin />
            </ProtectedRoute>
          } />
          <Route path="all-products" element={
            <ProtectedRoute requiredRole="super_admin">
              <AllProductsPage />
            </ProtectedRoute>
          } />
          <Route path="all-categories" element={
            <ProtectedRoute requiredRole="super_admin">
              <AllCategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="all-orders" element={
            <ProtectedRoute requiredRole="super_admin">
              <AllOrdersPage />
            </ProtectedRoute>
          } />
        </Route>
      </Route>

      {/* Fallback for unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
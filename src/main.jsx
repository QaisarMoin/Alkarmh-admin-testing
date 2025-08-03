import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CartProvider } from './contexts/CartContext.jsx'
import { WishlistProvider } from './contexts/WishlistContext.jsx' // Import WishlistProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider> {/* Wrap App with WishlistProvider */}
            <App />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </BrowserRouter>
  </StrictMode>,
)

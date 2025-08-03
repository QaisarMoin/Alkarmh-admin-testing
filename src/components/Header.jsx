import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiBell, FiUser, FiSearch, FiLogIn, FiLogOut, FiUserPlus, FiShoppingCart, FiHeart } from 'react-icons/fi' // Added FiHeart
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext' // Import useWishlist
import { toast } from 'react-toastify'

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist(); // Consume WishlistContext
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  const handleLogout = () => {
    logout();
    setShowUserMenu(false); // Close menu
    toast.success('Logged out successfully.');
    navigate('/login'); // Redirect to login page
  };
  
  // Sample notifications (can be dynamic later)
  const notifications = [
    { id: 1, text: 'New order #1234 received', time: '5 min ago', read: false },
    { id: 2, text: 'Product "Wireless Earbuds" is out of stock', time: '1 hour ago', read: false },
    { id: 3, text: 'Monthly sales report available', time: '3 hours ago', read: true },
  ]

  return (
    <header className="bg-white shadow-subtle z-10">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          
        </div>
        
        <div className="flex items-center justify-center  space-x-4">
          {/* User Menu / Auth Links */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center focus:outline-none"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {/* Display first letter of user's name or email if name is not available */}
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block ml-2 text-sm font-medium text-gray-700">
                  {user.name || user.email}
                </span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-elevated overflow-hidden z-20 animate-fade-in">
                  <div className="py-1">
                    {/* <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Your Profile
                    </Link> */}
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login" className="btn btn-secondary text-sm py-1.5 px-3 inline-flex items-center">
                <FiLogIn className="mr-1 h-4 w-4" />
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary text-sm py-1.5 px-3 inline-flex items-center">
                <FiUserPlus className="mr-1 h-4 w-4" />
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
      
     
    </header>
  )
}

export default Header
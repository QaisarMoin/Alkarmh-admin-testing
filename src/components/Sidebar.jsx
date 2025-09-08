import { NavLink, Link, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiShoppingBag, 
  FiPackage, 
  FiUsers, 
  FiBarChart2, 
  FiSettings, 
  FiHelpCircle,
  FiChevronDown,
  FiChevronRight,
  FiMenu
} from 'react-icons/fi'
import { IoBagAddOutline } from "react-icons/io5";
import { RiAdminFill } from "react-icons/ri";
import { MdOutlineCategory } from "react-icons/md";
import { useState, useEffect, createContext, useContext } from 'react'
import logo from '../assets/logo.svg'
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';

// Context to notify about category creation and session unlock
export const CategoryEventContext = createContext({ notifyCategoryCreated: () => {}, categoryCreatedThisSession: false });

const Sidebar = ({ isOpen: isOpenProp, isMobile: isMobileProp }) => {
  const location = useLocation()

  const { user: currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasCategory, setHasCategory] = useState(false);
  const { categoryEvent, categoryCreatedThisSession } = useContext(CategoryEventContext) || {};

  const userReady = !!(currentUser && currentUser._id && currentUser.managedShops && currentUser.managedShops.length > 0);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsOpen(false);
      } else {
        setIsMobile(false);
        setIsOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch categories for the user's shop (for customers only)
  useEffect(() => {
    if (!userReady) return; // Don't fetch until user context is ready
    const fetchCategories = async () => {
      try {
        const res = await api.get(`/api/categories?shop=${currentUser.managedShops[0]?._id || currentUser.managedShops[0]}`);
        const categories = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        const userCategories = categories.filter(cat => cat.createdBy === currentUser._id);
        setHasCategory(userCategories.length > 0);
      } catch {
        setHasCategory(false);
      }
    };
    fetchCategories();
  }, [userReady, currentUser]);

  // Hamburger toggle
  const handleHamburger = () => setIsOpen((prev) => !prev);

  // Set up expandable menu sections
  // const [expandedMenus, setExpandedMenus] = useState({
  //   products: false,
  //   orders: false,
  //   customers: false,
  // })
  
  // Check the current route and expand the appropriate menu
  // useEffect(() => {
  //   const currentPath = location.pathname
    
  //   setExpandedMenus({
  //     products: currentPath.includes('/products'),
  //     orders: currentPath.includes('/orders'),
  //     customers: currentPath.includes('/customers'),
  //   })
  // }, [location.pathname])
  
  // const toggleMenu = (menu) => {
  //   setExpandedMenus({
  //     ...expandedMenus,
  //     [menu]: !expandedMenus[menu]
  //   })
  // }
  

  
  // Classes based on sidebar state
  const sidebarClasses = `bg-white fixed h-full shadow-md z-20 sidebar-transition ${
    isOpen ? 'w-64' : 'w-0 lg:w-16'
  } ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`;

  // Determine if customer and has no shop
  const isCustomerNoShop = currentUser?.role === 'customer' && (!currentUser.managedShops || currentUser.managedShops.length === 0);
  // Determine if customer with shop but no category (and not created in this session)
  const isCustomerShopNoCategory = currentUser?.role === 'customer' && currentUser.managedShops && currentUser.managedShops.length > 0 && !hasCategory && !categoryCreatedThisSession;
  // If a category was created in this session, treat as hasCategory for unlock logic
  const unlockAllTabs = hasCategory || categoryCreatedThisSession;

  let menuItems = [];
  
  // Menu items based on user role
  if (currentUser?.role === 'worker') {
    // Workers only see Orders
    menuItems = [
      {
        name: 'Orders',
        icon: <FiPackage className="w-5 h-5" />,
        path: '/orders',
        exact: true
      }
    ];
  } else if (!currentUser || currentUser.role !== 'super_admin') {
    // Shop admin and other non-super admin users
    menuItems = [
      {
        name: 'Dashboard',
        icon: <FiHome className="w-5 h-5" />,
        path: '/',
        exact: true
      },
      {
        name: 'All Products',
        icon: <FiShoppingBag className="w-5 h-5" />,
        path: '/products'
      },
      {
        name: 'Add Product',
        icon: <IoBagAddOutline className="w-5 h-5" />,
        path: '/products/add'
      },
      {
        name: 'Categories',
        icon: <MdOutlineCategory className="w-5 h-5" />,
        path: '/products/categories'
      },
      {
        name: 'Orders',
        icon: <FiPackage className="w-5 h-5" />,
        path: '/orders'
      },
      {
        name: 'Settings',
        icon: <FiSettings className="w-5 h-5" />,
        path: '/settings'
      },
      // Add Workers tab for shop admins
      ...(currentUser?.role === 'shop_admin' ? [{
        name: 'Workers',
        icon: <FiUsers className="w-5 h-5" />, 
        path: '/workers'
      }] : [])
    ];
  }

  const sidebarItems = [
    ...menuItems,
    ...(currentUser?.role === 'super_admin' ? [
      {
        name: 'Super DashBoard',
        icon: <FiHome className="w-5 h-5" />, 
        path: '/superdashboard'
      },
      {
        name: 'Super Admin',
        icon: <RiAdminFill className="w-5 h-5" />, 
        path: '/superadmin'
      },
      {
        name: 'All Products',
        icon: <FiShoppingBag className="w-5 h-5" />, 
        path: '/all-products'
      },
      {
        name: 'All Categories',
        icon: <MdOutlineCategory className="w-5 h-5" />, 
        path: '/all-categories'
      },
      {
        name: 'All Orders',
        icon: <FiPackage className="w-5 h-5" />, 
        path: '/all-orders'
      }
    ] : [])
  ];

  return (
    <>
      {/* Hamburger for mobile/medium screens */}
      {isMobile && !isOpen && (
        <button
          className="fixed top-4 left-4 z-50 bg-white rounded-full shadow p-2 lg:hidden"
          onClick={handleHamburger}
        >
          <FiMenu className="h-6 w-6 text-gray-700" />
        </button>
      )}
      {/* Sidebar for large screens or overlay for mobile */}
      <aside
        className={`bg-white fixed h-full shadow-md z-20 sidebar-transition transition-all duration-300
          ${isOpen ? 'w-64' : 'w-0 lg:w-64'}
          ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'top-0 left-0' : ''}
        `}
        style={{ minWidth: isOpen ? 256 : 0 }}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header - Logo & Brand */}
          <div className={`flex items-center h-16 px-4 ${!isOpen && 'lg:justify-center'}`}>
            <Link to="/" className="flex items-center">
              {isOpen ? (
                <>
                  <img src={logo || '/vite.svg'} alt="Logo" className="h-8 w-8" />
                  <span className="ml-2 text-xl font-semibold text-gray-800">Admin</span>
                </>
              ) : (
                <img src={logo || '/vite.svg'} alt="Logo" className="h-8 w-8" />
              )}
            </Link>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-0.5">
              {sidebarItems.map((item, index) => {
                // For super_admin, never lock any tab
                if (currentUser?.role === 'super_admin') {
                  return (
                    <li key={index}>
                      <NavLink
                        to={item.path}
                        {...(item.name === 'All Products' ? { end: true } : {})}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2.5 transition-colors duration-200 hover:bg-gray-100 ${
                            isActive ? 'text-primary-600 font-medium' : 'text-gray-700'
                          }`
                        }
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        {item.icon}
                        {isOpen && <span className="ml-3">{item.name}</span>}
                      </NavLink>
                    </li>
                  );
                }
                
                // For workers, show all tabs but without read-only indicator
                if (currentUser?.role === 'worker') {
                  return (
                    <li key={index}>
                      <NavLink
                        to={item.path}
                        {...(item.name === 'All Products' ? { end: true } : {})}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2.5 transition-colors duration-200 hover:bg-gray-100 ${
                            isActive ? 'text-primary-600 font-medium' : 'text-gray-700'
                          }`
                        }
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        {item.icon}
                        {isOpen && <span className="ml-3">{item.name}</span>}
                      </NavLink>
                    </li>
                  );
                }
                // For shop_admin and customer, apply lock logic
                let isLocked = false;
                if (isCustomerNoShop && !['Settings', 'Help'].includes(item.name)) {
                  isLocked = true;
                } else if (!unlockAllTabs && !['Categories', 'Settings', 'Help'].includes(item.name)) {
                  isLocked = true;
                }
                return (
                  <li key={index}>
                    {isLocked ? (
                      <div
                        className="flex items-center px-4 py-2.5 text-gray-400 cursor-not-allowed opacity-60"
                        title={isCustomerNoShop ? "Please register your shop to access this section" : "Please create a category to access this section"}
                      >
                        {item.icon}
                        {isOpen && <span className="ml-3">{item.name}</span>}
                      </div>
                    ) : (
                      <NavLink
                        to={item.path}
                        {...(item.name === 'All Products' ? { end: true } : {})}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2.5 transition-colors duration-200 hover:bg-gray-100 ${
                            isActive ? 'text-primary-600 font-medium' : 'text-gray-700'
                          }`
                        }
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        {item.icon}
                        {isOpen && <span className="ml-3">{item.name}</span>}
                      </NavLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          
          
        </div>
      </aside>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-10 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
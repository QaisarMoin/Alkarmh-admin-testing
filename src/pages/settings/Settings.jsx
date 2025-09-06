import React, { useState, useEffect, useRef } from 'react'
import { FiSave, FiGlobe, FiDollarSign, FiTruck, FiMail, FiLock, FiLoader, FiAlertCircle, FiEye, FiEyeOff, FiPlus, FiTrash2 } from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext' // Import useAuth
import * as api from '../../utils/api' // Import api utility

const defaultOperatingHours = {
  monday: { open: '', close: '', isOpen: true },
  tuesday: { open: '', close: '', isOpen: true },
  wednesday: { open: '', close: '', isOpen: true },
  thursday: { open: '', close: '', isOpen: true },
  friday: { open: '', close: '', isOpen: true },
  saturday: { open: '', close: '', isOpen: true },
  sunday: { open: '', close: '', isOpen: false },
};

const initialState = {
  name: { en: '', ar: '' },
  description: { en: '', ar: '' },
  logo: '',
  banner: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    coordinates: { latitude: '', longitude: '' },
  },
  contact: {
    phone: '',
    email: '',
    website: '',
  },
  settings: {
    allowOnlineOrders: true,
    deliveryRadius: 10, // Legacy field, kept for backward compatibility
    minimumOrderAmount: 0, // Legacy field, kept for backward compatibility
    deliveryFee: 0, // Legacy field, kept for backward compatibility
    deliveryConfigurations: [
      {
        deliveryRadius: 10,
        minimumOrderAmount: 0,
        deliveryFee: 0,
      }
    ],
    operatingHours: defaultOperatingHours,
  },
};

const Settings = () => {
  const { user: currentUser, setUser, refreshUser } = useAuth(); // Get current user for email and setUser
  const [shop, setShop] = useState(initialState);
  const [loading, setLoading] = useState(false);
  
  // Add preview state for logo and banner
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const logoInputRef = useRef();
  const bannerInputRef = useRef();

  // Handle image file selection and preview
  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setLogoPreview(reader.result);
          setShop(prev => ({ ...prev, logo: reader.result }));
        } else if (type === 'banner') {
          setBannerPreview(reader.result);
          setShop(prev => ({ ...prev, banner: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setLogoPreview(reader.result);
          setShop(prev => ({ ...prev, logo: reader.result }));
        } else if (type === 'banner') {
          setBannerPreview(reader.result);
          setShop(prev => ({ ...prev, banner: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDragOver = (e) => e.preventDefault();

  // Fetch user's shop on mount and after create/update
  const fetchShop = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await api.get(`/api/shops/user/${currentUser?._id}`);
      console.log('Fetched shop data:', res.data); // Debug log for operating hours
      // getUserShops returns an array, use the first shop for this user
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const shopData = res.data[0];
        
        // Handle backward compatibility for deliveryConfigurations
        if (!shopData.settings.deliveryConfigurations) {
          shopData.settings.deliveryConfigurations = [{
            deliveryRadius: shopData.settings.deliveryRadius || 10,
            minimumOrderAmount: shopData.settings.minimumOrderAmount || 0,
            deliveryFee: shopData.settings.deliveryFee || 0
          }];
        }
        
        setShop({ ...initialState, ...shopData });
      } else {
        setShop(initialState);
      }
    } catch (err) {
      setShop(initialState);
    }
  };

  useEffect(() => {
    fetchShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // State for Change Password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  // Add state for password visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleChange = (e, path = []) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (path.length) {
      setShop(prev => {
        let obj = { ...prev };
        let ref = obj;
        for (let i = 0; i < path.length - 1; i++) {
          ref = ref[path[i]];
        }
        ref[path[path.length - 1]] = val;
        return obj;
      });
    } else {
      setShop(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setShop(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        operatingHours: {
          ...prev.settings.operatingHours,
          [day]: {
            ...prev.settings.operatingHours[day],
            [field]: field === 'isOpen' ? value : value,
          },
        },
      },
    }));
  };

  // Function to add a new delivery configuration
  const addDeliveryConfiguration = () => {
    setShop(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        deliveryConfigurations: [
          ...prev.settings.deliveryConfigurations,
          {
            deliveryRadius: 10,
            minimumOrderAmount: 0,
            deliveryFee: 0
          }
        ]
      }
    }));
  };

  // Function to remove a delivery configuration
  const removeDeliveryConfiguration = (index) => {
    if (shop.settings.deliveryConfigurations.length <= 1) {
      toast.warning("You must have at least one delivery configuration");
      return;
    }
    
    setShop(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        deliveryConfigurations: prev.settings.deliveryConfigurations.filter((_, i) => i !== index)
      }
    }));
  };

  // Function to update a delivery configuration
  const updateDeliveryConfiguration = (index, field, value) => {
    setShop(prev => {
      const updatedConfigurations = [...prev.settings.deliveryConfigurations];
      updatedConfigurations[index] = {
        ...updatedConfigurations[index],
        [field]: Number(value)
      };
      
      return {
        ...prev,
        settings: {
          ...prev.settings,
          deliveryConfigurations: updatedConfigurations
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure legacy fields are updated with the first delivery configuration for backward compatibility
      const firstConfig = shop.settings.deliveryConfigurations[0] || {
        deliveryRadius: 10,
        minimumOrderAmount: 0,
        deliveryFee: 0
      };
      
      const payload = {
        ...shop,
        settings: {
          ...shop.settings,
          // Update legacy fields with first configuration values
          deliveryRadius: firstConfig.deliveryRadius,
          minimumOrderAmount: firstConfig.minimumOrderAmount,
          deliveryFee: firstConfig.deliveryFee,
          operatingHours: { ...shop.settings.operatingHours }
        },
        userId: currentUser?._id,
        shopId: shop?._id
      };
      // Log the payload for debugging
      console.log('Submitting shop payload:', payload);
      let newShop = null;
      if (shop._id) {        
        await api.put(`/api/shops/${shop._id}`, payload);
        toast.success('Shop updated successfully!');
      } else {
        const res = await api.post('/api/shops', payload);
        newShop = res.data || res;
        toast.success('Shop registered successfully!');
      }
      await fetchShop();
      // Manually update user context and localStorage to include the shop ID
      if (newShop && newShop._id) {
        setUser(prev => ({
          ...prev,
          managedShops: [...(prev.managedShops || []), newShop._id]
        }));
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          managedShops: [...(currentUser.managedShops || []), newShop._id]
        }));
        if (refreshUser) await refreshUser();
      }
      if (shop._id && !(currentUser.managedShops || []).includes(shop._id)) {
        setUser(prev => ({
          ...prev,
          managedShops: [...(prev.managedShops || []), shop._id]
        }));
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          managedShops: [...(currentUser.managedShops || []), shop._id]
        }));
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordChangeError('');
    setPasswordChangeSuccess('');
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      setPasswordChangeError('All password fields are required.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      if (!currentUser || !currentUser.email) {
        setPasswordChangeError('User email not found. Please re-login.');
        setIsChangingPassword(false);
        return;
      }
      await api.post('/api/auth/change-password', {
        email: currentUser.email,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordChangeSuccess('Password changed successfully!');
      toast.success('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.';
      setPasswordChangeError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full p-8 bg-white rounded-xl shadow-lg mt-8">
      <PageHeader 
        title="Settings / Register Shop"
        subtitle="Register a new shop and configure your account details"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Settings' }
        ]}
      />
      <form onSubmit={handleSubmit} className="space-y-8 mb-12 bg-gray-50 p-6 rounded-lg shadow border border-gray-200 w-full">
        <h2 className="text-2xl font-bold mb-4 text-primary-700 border-b pb-2">Register Shop</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name (EN):</label>
            <input type="text" value={shop.name.en} onChange={e => handleChange(e, ['name', 'en'])} required className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name (AR):</label>
            <input type="text" value={shop.name.ar} onChange={e => handleChange(e, ['name', 'ar'])} required className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN):</label>
            <textarea value={shop.description.en} onChange={e => handleChange(e, ['description', 'en'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (AR):</label>
            <textarea value={shop.description.ar} onChange={e => handleChange(e, ['description', 'ar'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo:</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-gray-50"
              onClick={() => logoInputRef.current.click()}
              onDrop={e => handleDrop(e, 'logo')}
              onDragOver={handleDragOver}
              style={{ minHeight: 120 }}
            >
              {logoPreview || shop.logo ? (
                <img
                  src={logoPreview || shop.logo}
                  alt="Logo Preview"
                  className="h-20 w-auto object-contain mb-2"
                />
              ) : (
                <span className="text-gray-400">Drag & drop or click to upload logo</span>
              )}
              <input
                type="file"
                accept="image/*"
                ref={logoInputRef}
                style={{ display: 'none' }}
                onChange={e => handleImageChange(e, 'logo')}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner:</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-gray-50"
              onClick={() => bannerInputRef.current.click()}
              onDrop={e => handleDrop(e, 'banner')}
              onDragOver={handleDragOver}
              style={{ minHeight: 120 }}
            >
              {bannerPreview || shop.banner ? (
                <img
                  src={bannerPreview || shop.banner}
                  alt="Banner Preview"
                  className="h-20 w-auto object-contain mb-2"
                />
              ) : (
                <span className="text-gray-400">Drag & drop or click to upload banner</span>
              )}
              <input
                type="file"
                accept="image/*"
                ref={bannerInputRef}
                style={{ display: 'none' }}
                onChange={e => handleImageChange(e, 'banner')}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street:</label>
            <input type="text" value={shop.address.street} onChange={e => handleChange(e, ['address', 'street'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City:</label>
            <input type="text" value={shop.address.city} onChange={e => handleChange(e, ['address', 'city'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State:</label>
            <input type="text" value={shop.address.state} onChange={e => handleChange(e, ['address', 'state'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country:</label>
            <input type="text" value={shop.address.country} onChange={e => handleChange(e, ['address', 'country'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code:</label>
            <input type="text" value={shop.address.zipCode} onChange={e => handleChange(e, ['address', 'zipCode'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude:</label>
  <input
    type="number"
    value={shop.address.coordinates.latitude}
    onChange={e => handleChange(e, ['address', 'coordinates', 'latitude'])}
    className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
  />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude:</label>
  <input
    type="number"
    value={shop.address.coordinates.longitude}
    onChange={e => handleChange(e, ['address', 'coordinates', 'longitude'])}
    className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
  />
</div>

{/* Auto Detect Button */}
<div className="col-span-2">
  <button
    type="button"
    onClick={() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            setShop(prev => ({
              ...prev,
              address: {
                ...prev.address,
                coordinates: { latitude, longitude }
              }
            }));
            toast.success("Location detected successfully!");
          },
          error => {
            toast.error("Failed to detect location: " + error.message);
          }
        );
      } else {
        toast.error("Geolocation is not supported by this browser.");
      }
    }}
    className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
  >
    <FiGlobe className="mr-2 h-5 w-5" /> Auto Detect Location
  </button>
</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
            <input type="text" value={shop.contact.phone} onChange={e => handleChange(e, ['contact', 'phone'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input type="email" value={shop.contact.email} onChange={e => handleChange(e, ['contact', 'email'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website:</label>
            <input type="text" value={shop.contact.website} onChange={e => handleChange(e, ['contact', 'website'])} className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500" />
          </div>
        </div>
        <div className="mt-6 border-t pt-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
            <input
              type="checkbox"
              checked={shop.settings.allowOnlineOrders}
              onChange={e => setShop(s => ({
                ...s,
                settings: { ...s.settings, allowOnlineOrders: e.target.checked }
              }))}
              className="form-checkbox h-5 w-5 text-primary-600"
            />
            Allow Online Orders
          </label>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-primary-700">Delivery Configurations</h3>
              <button
                type="button"
                onClick={addDeliveryConfiguration}
                className="inline-flex items-center px-3 py-1 border border-primary-500 text-primary-600 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiPlus className="mr-1" /> Add Configuration
              </button>
            </div>
            
            <div className="space-y-4">
              {shop.settings.deliveryConfigurations.map((config, index) => (
                <div key={index} className="flex flex-wrap items-end gap-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km):</label>
                    <input
                      type="number"
                      value={config.deliveryRadius}
                      onChange={e => updateDeliveryConfiguration(index, 'deliveryRadius', e.target.value)}
                      className="form-input w-32 rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount:</label>
                    <input
                      type="number"
                      value={config.minimumOrderAmount}
                      onChange={e => updateDeliveryConfiguration(index, 'minimumOrderAmount', e.target.value)}
                      className="form-input w-32 rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee:</label>
                    <input
                      type="number"
                      value={config.deliveryFee}
                      onChange={e => updateDeliveryConfiguration(index, 'deliveryFee', e.target.value)}
                      className="form-input w-32 rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDeliveryConfiguration(index)}
                    className="inline-flex items-center px-2 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mb-1"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Keep the legacy fields for backward compatibility, but hide them */}
          <div className="hidden">
            <input type="number" value={shop.settings.deliveryRadius} onChange={e => setShop(s => ({
              ...s,
              settings: { ...s.settings, deliveryRadius: Number(e.target.value) }
            }))} />
            <input type="number" value={shop.settings.minimumOrderAmount} onChange={e => setShop(s => ({
              ...s,
              settings: { ...s.settings, minimumOrderAmount: Number(e.target.value) }
            }))} />
            <input type="number" value={shop.settings.deliveryFee} onChange={e => setShop(s => ({
              ...s,
              settings: { ...s.settings, deliveryFee: Number(e.target.value) }
            }))} />
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-primary-700">Operating Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(shop.settings.operatingHours).map(([day, { open, close, isOpen }]) => (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded p-3 shadow-sm w-full"
              >
                <strong className="w-24 min-w-[5rem] text-gray-700">{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>
                <div className="flex gap-2 w-full">
                  <input
                    type="time"
                    value={open}
                    onChange={e => handleOperatingHoursChange(day, 'open', e.target.value)}
                    className="form-input w-full sm:w-24 rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                  <input
                    type="time"
                    value={close}
                    onChange={e => handleOperatingHoursChange(day, 'close', e.target.value)}
                    className="form-input w-full sm:w-24 rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <label className="flex items-center mt-1 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={e => handleOperatingHoursChange(day, 'isOpen', e.target.checked)}
                    className="form-checkbox h-5 w-5 text-primary-600"
                  />
                  <span className="ml-1">Open</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="btn btn-primary inline-flex items-center px-6 py-2 rounded-lg shadow bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg transition-all duration-200" disabled={loading}>
          <FiSave className="mr-2 h-5 w-5" />
          {loading ? 'Saving...' : shop._id ? 'Update Shop' : 'Register Shop'}
        </button>
      </form>

      {/* Change Password Form */}
      <div className="card mt-12 bg-gray-50 p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center mb-4">
          <FiLock className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>

        {passwordChangeError && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>{passwordChangeError}</span>
          </div>
        )}
        {passwordChangeSuccess && (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 border border-green-400 rounded-md">
            {passwordChangeSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="oldPassword" className="form-label block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                id="oldPassword"
                name="oldPassword"
                className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500 pr-10"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowOldPassword(v => !v)}
                aria-label={showOldPassword ? 'Hide password' : 'Show password'}
              >
                {showOldPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500 pr-10"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowNewPassword(v => !v)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmNewPassword" className="form-label block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                id="confirmNewPassword"
                name="confirmNewPassword"
                className="form-input w-full rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500 pr-10"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowConfirmNewPassword(v => !v)}
                aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmNewPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center px-6 py-2 rounded-lg shadow bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg transition-all duration-200"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <FiLoader className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <FiLock className="mr-2 h-5 w-5" />
              )}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUserPlus, FiLoader, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as api from '../../utils/api';

const WorkerSignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    shopName: '',
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.name || !formData.email || !formData.password || !formData.shopName) {
      setFormError('Please fill in all fields.');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/worker-signup', formData);
      toast.success('Worker registered successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Registration failed. Please try again.';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <FiUserPlus className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Worker Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Register as a worker for a specific shop
          </p>
        </div>

        {formError && (
          <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>{formError}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="form-input mt-1"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input mt-1"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="form-input mt-1 pr-10"
                value={formData.password}
                onChange={handleChange}
                placeholder="•••••••• (min. 6 characters)"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
              Shop Name
            </label>
            <input
              id="shopName"
              name="shopName"
              type="text"
              required
              className="form-input mt-1"
              value={formData.shopName}
              onChange={handleChange}
              placeholder="Enter the shop name you work for"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full btn btn-primary flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <FiLoader className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <FiUserPlus className="h-5 w-5 mr-2" />
              )}
              Register as Worker
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default WorkerSignupPage; 
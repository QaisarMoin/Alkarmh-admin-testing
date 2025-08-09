import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiLogIn, FiLoader, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ForgotPasswordModal from '../../components/ui/ForgotPasswordModal';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error: authError, setError: setAuthError } = useAuth(); // Get setError to clear previous errors
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState(''); // For form-level validation errors
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (authError) setAuthError(null); // Clear auth error on new input
    if (formError) setFormError(''); // Clear form error on new input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); // Clear previous form errors
    if (!formData.email || !formData.password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      await login(formData);
      toast.success('Logged in successfully!');
      navigate('/'); // Redirect to dashboard or home
      window.location.reload(); // Reload the website after redirect
    } catch (err) {
      // Auth error is already set by AuthContext, but we can add a toast if needed
      toast.error(authError || 'Login failed.'); // authError is already set in context
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <FiLogIn className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {(authError || formError) && (
          <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>{authError || formError}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
            <input
              id="password"
              name="password"
                type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
                className="form-input mt-1 pr-10"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
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
            <button type="button" className="text-primary-600 hover:underline text-xs mt-2" onClick={() => setShowForgotModal(true)}>
              Forgot password?
            </button>
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
                <FiLogIn className="h-5 w-5 mr-2" />
              )}
              Sign in
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          Not a member?{' '}
          <Link
            to="/signup"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign up
          </Link>
          {' '}or{' '}
          <Link
            to="/worker-signup"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Register as Worker
          </Link>
        </p>
      </div>
      <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
    </div>
  );
};

export default LoginPage;

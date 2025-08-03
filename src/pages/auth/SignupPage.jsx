import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUserPlus, FiLoader, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { sendOtpByEmail, verifyOtpByEmail } from '../../utils/api';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error: authError, setError: setAuthError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (authError) setAuthError(null);
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setOtpLoading(true);
      await sendOtpByEmail(formData.email);
      setOtpStep(true);
      setOtpSent(true);
      toast.success('OTP sent to your email.');
    } catch (err) {
      setOtpError(err?.response?.data?.message || 'Failed to send OTP.');
      toast.error(err?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!otp) {
      setOtpError('Please enter the OTP.');
      return;
    }
    setOtpLoading(true);
    try {
      const verifyRes = await verifyOtpByEmail(formData.email, otp);

      if (!verifyRes || !verifyRes.success) {
        const msg = verifyRes?.message || 'OTP verification failed.';
        setOtpError(msg);
        toast.error(msg);
        // If OTP is expired, too many attempts, or not found, prompt to resend
        if (
          msg === 'No OTP sent to this email' ||
          msg === 'Too many incorrect attempts. Please request a new OTP.' ||
          msg === 'OTP expired'
        ) {
          setOtp(''); // Clear OTP input
          setOtpStep(false); // Go back to OTP request step
          setOtpSent(false);
        }
        return;
      }

      // Now complete the signup (create user in your DB)
      await signup(formData);
      toast.success('Signup successful! Please log in.');
      navigate('/login');
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      setOtpError(backendMsg || 'OTP verification failed.');
      toast.error(backendMsg || 'OTP verification failed.');
      // If OTP is expired, too many attempts, or not found, prompt to resend
      if (
        backendMsg === 'No OTP sent to this email' ||
        backendMsg === 'Too many incorrect attempts. Please request a new OTP.' ||
        backendMsg === 'OTP expired'
      ) {
        setOtp(''); // Clear OTP input
        setOtpStep(false); // Go back to OTP request step
        setOtpSent(false);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <FiUserPlus className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
        </div>
        {(authError || formError || otpError) && (
          <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>{authError || formError || otpError}</span>
          </div>
        )}
        {!otpStep ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full name</label>
              <input id="name" name="name" type="text" autoComplete="name" required className="form-input mt-1" value={formData.name} onChange={handleChange} placeholder="John Doe" />
          </div>
          <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="form-input mt-1" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required className="form-input mt-1 pr-10" value={formData.password} onChange={handleChange} placeholder="•••••••• (min. 6 characters)" />
                <button type="button" tabIndex={-1} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
              <button type="submit" className="w-full btn btn-primary flex justify-center items-center" disabled={isLoading || otpLoading}>
                {(isLoading || otpLoading) ? (
                <FiLoader className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <FiUserPlus className="h-5 w-5 mr-2" />
              )}
                {otpLoading ? 'Sending OTP...' : 'Sign up'}
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleOtpSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Enter OTP sent to your email</label>
              <input id="otp" name="otp" type="text" required className="form-input mt-1" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 5-digit OTP" />
            </div>
            <div className="flex justify-between items-center">
              <button type="button" className="text-primary-600 hover:underline text-sm" disabled={otpLoading} onClick={async () => {
                setOtpError('');
                setOtpLoading(true);
                try {
                  await sendOtpByEmail(formData.email);
                  toast.success('OTP resent to your email.');
                } catch (err) {
                  setOtpError(err?.response?.data?.message || 'Failed to resend OTP.');
                  toast.error(err?.response?.data?.message || 'Failed to resend OTP.');
                } finally {
                  setOtpLoading(false);
                }
              }}>Resend OTP</button>
              <button type="submit" className="btn btn-primary flex items-center" disabled={otpLoading}>
                {otpLoading ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : null}
                Verify OTP & Sign up
            </button>
          </div>
        </form>
        )}
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

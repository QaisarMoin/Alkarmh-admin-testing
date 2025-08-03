import React, { useState } from 'react';
import { forgotPasswordRequest, forgotPasswordVerifyOtp, resetPassword } from '../../utils/api';
import { FiMail, FiKey, FiEye, FiEyeOff, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      toast.success('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPasswordVerifyOtp(email, otp);
      if (!res || !res.success) {
        setError(res?.message || 'OTP verification failed.');
        return;
      }
      setStep(3);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || 'OTP verification failed.');
      if (
        msg === 'No OTP sent to this email' ||
        msg === 'Too many incorrect attempts. Please request a new OTP.' ||
        msg === 'OTP expired'
      ) {
        setStep(1);
        setOtp('');
        setError(msg + ' Please request a new OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(email, newPassword);
      if (!res || !res.success) {
        setError(res?.message || 'Failed to reset password.');
        return;
      }
      toast.success('Password reset successful! You can now log in.');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      toast.success('OTP resent to your email.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        {error && (
          <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md mb-4">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700">Registered Email</label>
              <div className="relative">
                <input id="fp-email" type="email" className="form-input mt-1 w-full" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                <FiMail className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            <button type="submit" className="w-full btn btn-primary flex justify-center items-center" disabled={loading}>
              {loading ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : null}
              Send OTP
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="fp-otp" className="block text-sm font-medium text-gray-700">Enter OTP sent to your email</label>
              <input id="fp-otp" type="text" className="form-input mt-1 w-full" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="Enter 5-digit OTP" />
            </div>
            <div className="flex justify-between items-center">
              <button type="button" className="text-primary-600 hover:underline text-sm" disabled={loading} onClick={handleResendOtp}>Resend OTP</button>
              <button type="submit" className="btn btn-primary flex items-center" disabled={loading}>
                {loading ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : null}
                Verify OTP
              </button>
            </div>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="fp-password" className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input id="fp-password" type={showPassword ? 'text' : 'password'} className="form-input mt-1 w-full pr-10" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="•••••••• (min. 6 characters)" />
                <button type="button" tabIndex={-1} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full btn btn-primary flex justify-center items-center" disabled={loading}>
              {loading ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : null}
              Set New Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal; 
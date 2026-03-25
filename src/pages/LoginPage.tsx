import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ResendOtpButton from '../components/ResendOtpButton';
import { authService } from '../services/cricketSocialService';
import { useAuthStore } from '../store/slices/authStore';
import type { LoginRequest } from '../types';
import { getPasswordValidationError } from '../utils/passwordValidation';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPasswords, setShowResetPasswords] = useState(false);
  const [forgotFieldErrors, setForgotFieldErrors] = useState<Record<string, string>>({});
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
        // Email format validation
        if (data.email) {
          if (!data.email.includes('@')) {
            setError('Email address must contain @');
            return;
          }
          if (!data.email.endsWith('.com')) {
            setError('Email address must end with .com');
            return;
          }
          if (/\s/.test(data.email)) {
            setError('Email address should not contain spaces anywhere.');
            return;
          }
          const domainPattern = /@([^.]+)\.com$/;
          const domainMatch = data.email.match(domainPattern);
          if (!domainMatch || !domainMatch[1]) {
            setError('Email address domain is incorrect.');
            return;
          }
        }
    setError('');
    // Show react-hook-form errors for empty fields
    if (errors.email && errors.password) {
      setError('Email Address and Password should not be empty.');
      return;
    } else if (errors.email) {
      setError('Email Address is required');
      return;
    } else if (errors.password) {
      setError('Password is required');
      return;
    }
    try {
      const res = await authService.login(data);
      console.log('Full login API response:', res);
      // Only access properties that exist on AuthResponse
      const token = res.data?.data?.accessToken;
        const user = res.data?.data?.user;
      console.log('Extracted token:', token);
      console.log('Extracted user:', user);
      if (token) {
        sessionStorage.setItem('token', token);
        localStorage.setItem('token', token);
        console.log('Token stored in sessionStorage:', sessionStorage.getItem('token'));
        console.log('Token stored in localStorage:', localStorage.getItem('token'));
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('User stored in localStorage:', localStorage.getItem('user'));
        login(token, user);
      } else {
        setError('Login response missing user information.');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password.');
      console.error('Login error:', err);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setForgotFieldErrors({});

    if (forgotStep === 'email') {
      // Email validation (same as Register page)
      let email = forgotEmail ? forgotEmail.trim() : '';
      if (!email) {
        setForgotFieldErrors({ email: 'Email Address is required' });
        return;
      }
      if (!email.includes('@')) {
        setForgotFieldErrors({ email: 'Email address must contain @' });
        return;
      }
      if (!email.endsWith('.com')) {
        setForgotFieldErrors({ email: 'Invalid email address' });
        return;
      }
      if (/\s/.test(email)) {
        setForgotFieldErrors({ email: 'Email address should not contain spaces anywhere.' });
        return;
      }
      const domainMatch = email.match(/@([^.]+)\.com$/);
      if (!domainMatch || !domainMatch[1]) {
        setForgotFieldErrors({ email: 'Invalid email address' });
        return;
      }
      const domainPattern = /\.[a-zA-Z]{2,}$/;
      if (!domainPattern.test(email)) {
        setForgotFieldErrors({ email: 'Invalid email address' });
        return;
      }
      try {
        await authService.forgotPassword(email);
        setForgotStep('otp');
      } catch {
        setForgotFieldErrors({ email: 'Failed to send OTP. Please check your email.' });
      }
    } else if (forgotStep === 'otp') {
      if (otp.length !== 6) {
        setForgotFieldErrors({ otp: 'Please enter the 6-digit OTP.' });
        return;
      }

      setForgotStep('reset');
    } else if (forgotStep === 'reset') {
      const errs: Record<string, string> = {};
      const passwordValidationError = getPasswordValidationError(newPassword);
      if (passwordValidationError) {
        errs.newPassword = passwordValidationError;
      }

      if (newPassword !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }

      if (Object.keys(errs).length > 0) {
        setForgotFieldErrors(errs);
        return;
      }
      try {
        await authService.resetPassword(forgotEmail, otp, newPassword);
        setForgotStep('done');
      } catch {
        setError('Invalid OTP or failed to reset password. Please try again.');
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: 'url(/images/bg_homepage.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/60" />

      {/* Logo */}
      <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2">
        <img src="/images/cs-logo.png" alt="CricketSocial" className="h-10" />
        <span className="text-white font-bold text-xl">CricketSocial</span>
      </Link>

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        {!showForgotPassword ? (
          /* Login Form */
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
             <div className="bg-brand-green py-4 text-center">
  
  <h1 className="text-xl font-bold text-white">Sign In</h1>
  
   

</div>

            <div className="p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate  className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="input-field"
                   
                  />
                  {errors.email && (
                    <div className="text-red-600 text-xs mt-1">Email Address is required</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    {...register('password', { required: true })}
                    className="input-field"
                    placeholder=""
                    onInput={e => {
                      const input = e.target as HTMLInputElement;
                      input.value = input.value.replace(/^\s+/, '');
                    }}
                  />
                  {errors.password && (
                    <div className="text-red-600 text-xs mt-1">Password is required</div>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLoginPassword}
                      onChange={(e) => setShowLoginPassword(e.target.checked)}
                      className="w-4 h-4 text-brand-green rounded"
                    />
                    Show password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setError(''); }}
                    className="text-brand-green hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3 text-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-brand-green font-semibold hover:underline">
                    Register Now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Forgot Password Flow */
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-brand-green p-6 text-center">
              <h1 className="text-2xl font-bold text-white">
                {forgotStep === 'done' ? 'Password Reset!' : 'Forgot Password'}
              </h1>
              <p className="text-green-200 text-sm mt-1">
                {forgotStep === 'email' && 'Enter your email to receive an OTP'}
                {forgotStep === 'otp' && 'Enter the OTP sent to your email'}
                {forgotStep === 'reset' && 'Create a new password'}
                {forgotStep === 'done' && 'Your password has been reset successfully'}
              </p>
            </div>

            <div className="p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              {forgotStep === 'email' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      className="input-field" />
                    {forgotFieldErrors.email && (
                      <div className="text-red-600 text-xs mt-1">{forgotFieldErrors.email}</div>
                    )}
                  </div>
                  <button type="button" onClick={handleForgotPassword} className="w-full btn-primary py-3">Send OTP</button>
                </div>
              )}
              {forgotStep === 'otp' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-field text-center text-2xl tracking-[0.5em]" maxLength={6} />
                    {forgotFieldErrors.otp && (
                      <div className="text-red-600 text-xs mt-1">{forgotFieldErrors.otp}</div>
                    )}
                    <ResendOtpButton
                      email={forgotEmail}
                      setError={setError}
                      setSuccessMessage={(msg: string) => setError(msg)}
                    />
                  </div>
                  <button type="button" onClick={handleForgotPassword} className="w-full btn-primary py-3">Verify OTP</button>
                </div>
              )}
              {forgotStep === 'reset' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <input
                      type={showResetPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value.replace(/^\s+/, ''))}
                      className="input-field"
                       
                    />
                    {forgotFieldErrors.newPassword && (
                      <div className="text-red-600 text-xs mt-1">{forgotFieldErrors.newPassword}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <input
                      type={showResetPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.replace(/^\s+/, ''))}
                      className="input-field"
                    
                    />
                    {forgotFieldErrors.confirmPassword && (
                      <div className="text-red-600 text-xs mt-1">{forgotFieldErrors.confirmPassword}</div>
                    )}
                    <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showResetPasswords}
                        onChange={(e) => setShowResetPasswords(e.target.checked)}
                        className="w-4 h-4 text-brand-green rounded"
                      />
                      Show password
                    </label>
                  </div>
                  <button type="button" onClick={handleForgotPassword} className="w-full btn-primary py-3">Reset Password</button>
                </div>
              )}
              {forgotStep === 'done' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-gray-600">You can now sign in with your new password.</p>
                  <button onClick={() => { setShowForgotPassword(false); setForgotStep('email'); }} className="w-full btn-primary py-3">
                    Back to Sign In
                  </button>
                </div>
              )}

              {forgotStep !== 'done' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      if (forgotStep === 'reset') {
                        setForgotStep('otp');
                        setError('');
                      } else {
                        setShowForgotPassword(false);
                        setError('');
                      }
                    }}
                    className="text-sm text-gray-500 hover:text-brand-green">
                    {forgotStep === 'reset' ? '← Back to OTP' : '← Back to Sign In'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

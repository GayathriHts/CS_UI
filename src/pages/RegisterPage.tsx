import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/cricketSocialService';
import { useAuthStore } from '../store/slices/authStore';
import type { RegisterConfirmRequest, RegisterRequest, RegisterStartRequest } from '../types';
import { getPasswordValidationError } from '../utils/passwordValidation';

type TabType = 'email' | 'mobile';
type Step = 'details' | 'otp';

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [step, setStep] = useState<Step>('details');
  const [countryCode, setCountryCode] = useState('+1');
  const [otpValue, setOtpValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const { register, getValues, trigger, formState: { isSubmitting } } = useForm<RegisterRequest>();

  const buildRegisterStartPayload = (): RegisterStartRequest => {
    const rawPhoneNumber = (getValues('phoneNumber') || '').replace(/\D/g, '');

    return {
      firstName: getValues('firstName'),
      lastName: getValues('lastName'),
      email: activeTab === 'email' ? getValues('email') : undefined,
      mobileNumber: activeTab === 'mobile' && rawPhoneNumber ? `${countryCode}${rawPhoneNumber}` : undefined,
    };
  };

  const buildRegisterConfirmPayload = (data: RegisterRequest): RegisterConfirmRequest => ({
    firstName: data.firstName,
    lastName: data.lastName,
    email: activeTab === 'email' ? data.email : undefined,
    mobileNumber: activeTab === 'mobile' && data.phoneNumber ? `${countryCode}${data.phoneNumber.replace(/\D/g, '')}` : undefined,
    password: data.password,
    otp: otpValue,
  });

  const handleContinue = async () => {
            // Custom email validation
            if (activeTab === 'email') {
              let email = getValues('email');
              if (typeof email === 'string') {
                email = email.trim();
              }
              // Must contain '@'
              if (!email.includes('@')) {
                setError('Email address must contain @');
                return;
              }
              // Must end with '.com'
              if (!email.endsWith('.com')) {
                setError('Email address must end with .com');
                return;
              }
              // No spaces
              if (/\s/.test(email)) {
                setError('Email address should not contain spaces anywhere.');
                return;
              }
              // Invalid domain after .com
              const domainPattern = /\.[a-zA-Z]{2,}$/;
              if (!domainPattern.test(email)) {
                setError('Email address domain is invalid.');
                return;
              }
            }
        // Phone number: should not allow alphabetic characters
        const phoneNumber = getValues('phoneNumber');
        if (activeTab === 'mobile' && /[A-Za-z]/.test(phoneNumber)) {
          setError('Phone Number should not contain alphabetic characters.');
          return;
        }
    setError('');

    const fieldsToValidate: Array<keyof RegisterRequest> = ['firstName', 'lastName'];
    if (activeTab === 'email') {
      fieldsToValidate.push('email');
    } else {
      fieldsToValidate.push('phoneNumber');
    }

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) {
      setError(activeTab === 'email' ? 'Please fill in your name and email.' : 'Please fill in your name and mobile number.');
      return;
    }

    // Custom validation for names and email
    const firstName = getValues('firstName');
    const lastName = getValues('lastName');
    let email = getValues('email');
    if (typeof email === 'string') {
      email = email.trim();
    }

    // No initial space for first name or last name
    if (/^\s/.test(firstName) || /^\s/.test(lastName)) {
      setError('First Name and Last Name should not start with a space.');
      return;
    }

   
    
    // No numbers or special chars for names
    if (/[^A-Za-z]/.test(firstName) || /[^A-Za-z]/.test(lastName)) {
      setError('First and Last Name should only contain alphabets.');
      return;
    }

    // First letter capitalized for names
    if (!/^[A-Z]/.test(firstName) || !/^[A-Z]/.test(lastName)) {
      setError('First letter of First and Last Name should be capitalized.');
      return;
    }

    // Email: no spaces anywhere (including trailing/leading)
    if (activeTab === 'email' && email && /\s/.test(email)) {
      setError('Email address should not contain spaces anywhere.');
      return;
    }

    try {
      const payload = buildRegisterStartPayload();
      if (activeTab === 'email' && !payload.email) {
        setError('Please enter an email address.');
        return;
      }
      if (activeTab === 'mobile' && !payload.mobileNumber) {
        setError('Please enter a mobile number.');
        return;
      }

      await authService.startRegister(payload);
      setPendingPhoneNumber(payload.mobileNumber || '');
      setPendingEmail(payload.email || '');
      setStep('otp');
    } catch {
      setError('Failed to send OTP. Please check the details and try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');

    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    const hasValidPassword = await trigger('password');
    if (!hasValidPassword) {
      setError('Please enter a password with at least 8 characters.');
      return;
    }

    const password = getValues('password');
    const passwordValidationError = getPasswordValidationError(password);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const data = getValues();
      const res = await authService.confirmRegister(buildRegisterConfirmPayload(data));
      loginStore(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid OTP or registration failed.';
      setError(msg);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: 'url(/images/bg_homepage.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2">
        <img src="/images/cs-logo.png" alt="CricketSocial" className="h-10" />
        <span className="text-white font-bold text-xl">CricketSocial</span>
      </Link>

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-brand-green p-6 text-center">
             <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-green-200 text-sm mt-1">
              {step === 'details' && ''}
              {step === 'otp' && (activeTab === 'email' ? 'Verify your email address' : 'Verify your mobile number')}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

            {step === 'details' && (
              <>
                {/* Tabs: Email / Mobile */}
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('email')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                      activeTab === 'email' ? 'bg-brand-green text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                     Use My Email
                  </button>
                  <button
                    onClick={() => setActiveTab('mobile')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                      activeTab === 'mobile' ? 'bg-brand-green text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                     Use My Mobile
                  </button>
                </div>

                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                      <input
                        {...register('firstName', { required: true })}
                        className="input-field"
                        placeholder=""
                        onInput={e => {
                          let value = e.target.value.replace(/[^A-Za-z]/g, '');
                          if (value.length > 0) {
                            value = value.charAt(0).toUpperCase() + value.slice(1);
                          }
                          e.target.value = value;
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                      <input
                        {...register('lastName', { required: true })}
                        className="input-field"
                        placeholder=""
                        onInput={e => {
                          let value = e.target.value.replace(/[^A-Za-z]/g, '');
                          if (value.length > 0) {
                            value = value.charAt(0).toUpperCase() + value.slice(1);
                          }
                          e.target.value = value;
                        }}
                      />
                    </div>
                  </div>

                  {activeTab === 'email' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        {...register('email', { required: activeTab === 'email' })}
                        className="input-field"
                        placeholder=""
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                      <div className="flex gap-2">
                        <select className="input-field w-24 text-sm" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                          <option>+1</option>
                          <option>+91</option>
                          <option>+44</option>
                          <option>+61</option>
                        </select>
                        <input
                          type="tel"
                          {...register('phoneNumber', { required: activeTab === 'mobile' })}
                          className="input-field flex-1"
                          placeholder=""
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full btn-primary py-3 text-lg"
                  >
                    SEND OTP
                  </button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <div className="space-y-5">
                <div className="text-center mb-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Enter the 6-digit OTP sent to {activeTab === 'email' ? pendingEmail : pendingPhoneNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">Enter Verification Code</label>
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center text-3xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    placeholder="------"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Create Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    {...register('password', { required: true, minLength: 8 })}
                    className="input-field"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Re-enter password"
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="w-4 h-4 text-brand-green rounded"
                    />
                    Show password
                  </label>
                </div>
                <button type="button" onClick={handleVerifyOtp} className="w-full btn-primary py-3 text-lg">
                  Verify OTP & Create Account
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-green font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

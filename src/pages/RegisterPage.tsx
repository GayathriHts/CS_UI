import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/cricketSocialService';
import { useAuthStore } from '../store/slices/authStore';
import type { RegisterConfirmRequest, RegisterRequest, RegisterStartRequest } from '../types';
import { getPasswordValidationError } from '../utils/passwordValidation';
import ResendOtpButton from '../components/ResendOtpButton';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    setError('');
    setFieldErrors({});
    const errs: Record<string, string> = {};

    const firstName = getValues('firstName');
    const lastName = getValues('lastName');
    let email = getValues('email');
    if (typeof email === 'string') {
      email = email.trim();
    }

    if (activeTab === 'email') {
      if (!firstName) errs.firstName = 'First Name is required';
      if (!lastName) errs.lastName = 'Last Name is required';
      if (!email) {
        errs.email = 'Email Address is required';
      } else if (!email.includes('@')) {
        errs.email = 'Email address must contain @';
      } else {
        const domainMatch = email.match(/@([^.]+)\.com$/);
        if (!domainMatch || !domainMatch[1]) {
          errs.email = 'Invalid email address';
        } else if (!email.endsWith('.com')) {
          errs.email = 'Email address must end with .com';
        } else if (/\s/.test(email)) {
          errs.email = 'Email address should not contain spaces anywhere.';
        } else {
          const domainPattern = /\.[a-zA-Z]{2,}$/;
          if (!domainPattern.test(email)) {
            errs.email = 'Email address domain is invalid.';
          }
        }
      }
    }

    const phoneNumber = getValues('phoneNumber');
    if (activeTab === 'mobile') {
      if (!firstName) errs.firstName = 'First Name is required';
      if (!lastName) errs.lastName = 'Last Name is required';
      if (!phoneNumber) {
        errs.phoneNumber = 'Mobile Number is required';
      } else if (/[A-Za-z]/.test(phoneNumber)) {
        errs.phoneNumber = 'Phone Number should not contain alphabetic characters.';
      }
    }

    // Name validations (only if names are provided)
    if (firstName) {
      if (/^\s/.test(firstName)) {
        errs.firstName = 'First Name should not start with a space.';
      } else if (/[^A-Za-z]/.test(firstName)) {
        errs.firstName = 'First Name should only contain alphabets.';
      } else if (!/^[A-Z]/.test(firstName)) {
        errs.firstName = 'First letter of First Name should be capitalized.';
      }
    }
    if (lastName) {
      if (/^\s/.test(lastName)) {
        errs.lastName = 'Last Name should not start with a space.';
      } else if (/[^A-Za-z]/.test(lastName)) {
        errs.lastName = 'Last Name should only contain alphabets.';
      } else if (!/^[A-Z]/.test(lastName)) {
        errs.lastName = 'First letter of Last Name should be capitalized.';
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    try {
      const payload = buildRegisterStartPayload();
      if (activeTab === 'email' && !payload.email) {
        setFieldErrors({ email: 'Please enter an email address.' });
        return;
      }
      if (activeTab === 'mobile' && !payload.mobileNumber) {
        setFieldErrors({ phoneNumber: 'Please enter a mobile number.' });
        return;
      }

      await authService.startRegister(payload);
      setPendingPhoneNumber(payload.mobileNumber || '');
      setPendingEmail(payload.email || '');
      setStep('otp');
    } catch (err: any) {
      let errorMsg = '';
      const response = err?.response;
      if (response && typeof response === 'object' && response.data && typeof response.data === 'object' && 'error' in response.data) {
        errorMsg = response.data.error;
      }
      if (typeof errorMsg === 'string' && errorMsg.length > 0) {
        if (errorMsg.toLowerCase().includes('already') && errorMsg.toLowerCase().includes('email')) {
          setError('This user already has an account. Please login.');
        } else {
          setError(errorMsg);
        }
      } else {
        setError('This user already has an account. Please login.');
      }
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setFieldErrors({});
    const errs: Record<string, string> = {};

    const data = getValues();
    if (otpValue.length !== 6) {
      errs.otp = 'Please enter the 6-digit OTP.';
    }

    const hasValidPassword = await trigger('password');
    if (!hasValidPassword) {
      errs.password = 'Please create a 8-character strong password with one uppercase letter, one lowercase letter, one special character and with numeric';
    } else {
      const password = getValues('password');
      const passwordValidationError = getPasswordValidationError(password);
      if (passwordValidationError) {
        errs.password = passwordValidationError;
      } else if (!confirmPassword) {
        errs.confirmPassword = 'Please enter Confirm Password';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = "Confirmation password doesn't match";
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    try {
      const res = await authService.confirmRegister(buildRegisterConfirmPayload(data));
     loginStore(res.data.data.accessToken, res.data.data.user);
     
        navigate('/dashboard');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: any } })?.response?.data;
      const errorStr = resp?.message || resp?.error || '';
      const errorLower = (typeof errorStr === 'string' ? errorStr : JSON.stringify(errorStr)).toLowerCase();
      if (errorLower.includes('otp') || errorLower.includes('invalid') || errorLower.includes('expired')) {
        setFieldErrors({ otp: 'Invalid OTP' });
      } else {
        setFieldErrors({ otp: 'Invalid OTP or registration failed.' });
      }
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
              {step === 'otp' && (activeTab === 'email' ? 'Verify your email address Enter 6 digit password' : 'Verify your mobile number')}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
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
                          const input = e.target as HTMLInputElement;
                          let value = input.value.replace(/[^A-Za-z]/g, '');
                          if (value.length > 0) {
                            value = value.charAt(0).toUpperCase() + value.slice(1);
                          }
                          input.value = value;
                        }}
                      />
                      {fieldErrors.firstName && (
                        <div className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                      <input
                        {...register('lastName', { required: true })}
                        className="input-field"
                        placeholder=""
                        onInput={e => {
                          const input = e.target as HTMLInputElement;
                          let value = input.value.replace(/[^A-Za-z]/g, '');
                          if (value.length > 0) {
                            value = value.charAt(0).toUpperCase() + value.slice(1);
                          }
                          input.value = value;
                        }}
                      />
                      {fieldErrors.lastName && (
                        <div className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</div>
                      )}
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
                      {fieldErrors.email && (
                        <div className="text-red-600 text-xs mt-1">{fieldErrors.email}</div>
                      )}
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
                      {fieldErrors.phoneNumber && (
                        <div className="text-red-600 text-xs mt-1">{fieldErrors.phoneNumber}</div>
                      )}
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
              <div className="space-y-1">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5 text-center">Enter Verification Code</label>
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field w-full text-center text-base tracking-[0.2em] font-mono py-1"
                    maxLength={6}
                    placeholder="------"
                    autoFocus
                  />
                  {fieldErrors.otp && (
                    <div className="text-red-600 text-xs mt-1">{fieldErrors.otp}</div>
                  )}
                  <ResendOtpButton
                    registrationPayload={buildRegisterStartPayload()}
                    setError={setError}
                    setSuccessMessage={(msg: string) => setError(msg)}
                    resendType="register"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Create Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    {...register('password', { required: true, minLength: 8 })}
                    className="input-field"
                    onInput={e => {
                      const input = e.target as HTMLInputElement;
                      input.value = input.value.replace(/\s/g, '');
                    }}
                  />
                  {fieldErrors.password && (
                    <div className="text-red-600 text-xs mt-1">{fieldErrors.password}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                    className="input-field"
                  />
                  {fieldErrors.confirmPassword && (
                    <div className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</div>
                  )}
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

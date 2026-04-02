import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/cricketSocialService';
import { useAuthStore } from '../store/slices/authStore';
import type { RegisterConfirmRequest, RegisterRequest, RegisterStartRequest } from '../types';
import { getPasswordValidationError } from '../utils/passwordValidation';
import ResendOtpButton from '../components/ResendOtpButton';
import OtpInput from '../components/OtpInput';
import PasswordInput from '../components/PasswordInput';

type TabType = 'email' | 'mobile';
type Step = 'details' | 'otp' | 'password';

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [step, setStep] = useState<Step>('details');
  const [countryCode, setCountryCode] = useState('+1');
  const [otpValue, setOtpValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, watch, getValues, setValue, trigger, formState: { isSubmitting } } = useForm<RegisterRequest>();
  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');
  const watchedEmail = watch('email');
  const watchedPhone = watch('phoneNumber');
  const watchedPassword = watch('password');

  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => setSuccessMessage(''), 6000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

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
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,3}$/;
        if (!emailRegex.test(email)) {
          errs.email = 'Please enter a valid email';
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
      setLoading(true);
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
          setError('This user already has an account. Please sign in.');
        } else {
          setError(errorMsg);
        }
      } else {
        setError('This user already has an account. Please sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setFieldErrors({});

    if (otpValue.length !== 6) {
      setFieldErrors({ otp: 'Please enter the 6-digit OTP.' });
      return;
    }

    try {
      setLoading(true);
      const email = activeTab === 'email' ? getValues('email') : '';
      await authService.verifyRegisterOtp(email || '', otpValue);
      setStep('password');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: any } })?.response?.data;
      const errorStr = resp?.error?.message || resp?.message || resp?.error || '';
      const errorLower = (typeof errorStr === 'string' ? errorStr : JSON.stringify(errorStr)).toLowerCase();
      if (errorLower.includes('otp') || errorLower.includes('invalid') || errorLower.includes('expired')) {
        setFieldErrors({ otp: 'Invalid OTP. Please try again' });
      } else {
        setFieldErrors({ otp: 'Invalid OTP or verification failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError('');
    setFieldErrors({});
    const errs: Record<string, string> = {};

    const data = getValues();
    const password = getValues('password');

    const passwordValidationError = getPasswordValidationError(password);

    if (!confirmPassword) {
      errs.confirmPassword = 'Please enter Confirm Password';
    } else if (password && !passwordValidationError && password !== confirmPassword) {
      errs.confirmPassword = "Confirmation password doesn't match";
    }

    if (passwordValidationError || Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    try {
      setLoading(true);
      const res = await authService.confirmRegister(buildRegisterConfirmPayload(data));
      loginStore(res.data.data.accessToken, res.data.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: any } })?.response?.data;
      const errorStr = resp?.error?.message || resp?.message || resp?.error || '';
      const errorLower = (typeof errorStr === 'string' ? errorStr : JSON.stringify(errorStr)).toLowerCase();
      if (errorLower.includes('otp') || errorLower.includes('invalid') || errorLower.includes('expired')) {
        setError('Registration failed. Please try again.');
      } else if (typeof errorStr === 'string' && errorStr.length > 0) {
        setError(errorStr);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
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
      </Link>

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-brand-green py-4 text-center">
             <h1 className="text-lg font-semibold text-white">Sign Up</h1>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}
            {successMessage && (
              <div className="text-black text-sm text-center mb-4 p-2">
                {successMessage}
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
                          setValue('firstName', value, { shouldValidate: true });
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
                          setValue('lastName', value, { shouldValidate: true });
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

                  <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!watchedFirstName?.trim() || !watchedLastName?.trim() || (activeTab === 'email' ? !watchedEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,3}$/.test(watchedEmail?.trim() || '') : !watchedPhone?.trim()) || loading}
                    className="btn-primary rounded-full py-2.5 px-16 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</span> : 'SEND OTP'}
                  </button>
                  </div>
                </form>
              </>
            )}

            {step === 'otp' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">Enter the 6-digit code sent to your email</label>
                  <div className="flex flex-col items-center">
                    <div>
                      <OtpInput value={otpValue} onChange={setOtpValue} />
                      {fieldErrors.otp && (
                        <div className="text-red-600 text-xs mt-1">{fieldErrors.otp}</div>
                      )}
                      <div className="text-right mt-1">
                        <ResendOtpButton
                          registrationPayload={buildRegisterStartPayload()}
                          setError={setError}
                          setSuccessMessage={(msg: string) => { setError(''); setSuccessMessage(msg); }}
                          resendType="register"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                <button type="button" onClick={handleVerifyOtp} disabled={otpValue.length !== 6 || loading} className="btn-primary rounded-full py-2.5 px-16 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Verifying...</span> : 'Verify OTP'}
                </button>
                </div>
              </div>
            )}

            {step === 'password' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Create Password</label>
                  <PasswordInput
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    {...register('password', { required: true, minLength: 8 })}
                    onCopy={e => e.preventDefault()}
                    onCut={e => e.preventDefault()}
                    onInput={e => {
                      const input = e.target as HTMLInputElement;
                      input.value = input.value.replace(/\s/g, '');
                    }}
                  />
                  {getPasswordValidationError(watchedPassword || '') && (
                    <div className="text-gray-500 text-xs mt-1">Please create a strong password with at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <PasswordInput
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                    onCopy={e => e.preventDefault()}
                    onCut={e => e.preventDefault()}
                  />
                  {fieldErrors.confirmPassword && (
                    <div className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</div>
                  )}
                </div>
                <div className="flex justify-center">
                <button type="button" onClick={handleCreateAccount} disabled={!watchedPassword || !confirmPassword || loading} className="btn-primary rounded-full py-2.5 px-16 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Signing up...</span> : 'Sign Up'}
                </button>
                </div>
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

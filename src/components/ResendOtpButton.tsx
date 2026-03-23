import React, { useState, useRef, useEffect } from 'react';
import { authService } from '../services/cricketSocialService';


// For registration OTP resend, pass the full registration payload
interface ResendOtpButtonProps {
  email?: string;
  registrationPayload?: {
    firstName: string;
    lastName: string;
    email?: string;
    mobileNumber?: string;
  };
  setError: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
  resendType?: 'register' | 'email';
}

const ResendOtpButton: React.FC<ResendOtpButtonProps> = ({ email, registrationPayload, setError, setSuccessMessage, resendType = 'email' }) => {
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timer > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer]);

  const handleResendOtp = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      if (resendType === 'register' && registrationPayload) {
        await authService.resendRegisterOtp(registrationPayload);
      } else if (email) {
        await authService.sendEmailOtp(email);
      } else {
        throw new Error('Missing email or registration payload');
      }
      setSuccessMessage('OTP resent successfully');
      setTimer(30); // Start 30s cooldown
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 text-center">
      <button
        type="button"
        className="text-brand-green font-medium underline"
        onClick={handleResendOtp}
        disabled={timer > 0 || loading}
      >
        {timer > 0 ? `Resend OTP (${timer}s)` : 'Resend OTP'}
      </button>
    </div>
  );
};

export default ResendOtpButton;

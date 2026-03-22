import React, { useState, useRef, useEffect } from 'react';
import { authService } from '../services/cricketSocialService';

interface ResendOtpButtonProps {
  email: string;
  setError: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
}

const ResendOtpButton: React.FC<ResendOtpButtonProps> = ({ email, setError, setSuccessMessage }) => {
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
      await authService.sendEmailOtp(email);
      setSuccessMessage('OTP resent successfully.');
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

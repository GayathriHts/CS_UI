import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/slices/authStore';

interface NavbarProps {
  title?: string;
  backTo?: string;
  rightContent?: React.ReactNode;
  variant?: 'default' | 'dark';
}

export default function Navbar({ title, backTo, rightContent, variant = 'default' }: NavbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const bgClass = variant === 'dark' ? 'bg-black/90 backdrop-blur-sm' : 'bg-brand-dark shadow-lg';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${bgClass}`}>
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            {backTo && (
              <Link to={backTo} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/cs-logo.png" alt="CricketSocial" className="h-8" />
            </Link>
          </div>
          {title && <h2 className="text-white font-semibold">{title}</h2>}
          <div className="flex items-center gap-3">
            {rightContent}
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="text-white/80 hover:text-white text-sm px-3 py-1.5 border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

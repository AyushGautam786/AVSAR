import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Target, LogIn, LogOut } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onSignIn,
  onSignOut
}) => {
  const location = useLocation();

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      `https://ui-avatars.com/api/?name=${user?.user_metadata?.name || user?.email}&background=3b82f6&color=fff`;
  };

  const getUserName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header
      className="fixed w-full z-40 transition-all duration-300 border-b border-gray-200 bg-gray-200/90 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-blue-600" />
            <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              PMIS SIH
            </Link>
          </div>

          {/* Center: Navigation */}
          {user && (
            <nav className="flex-1 flex justify-center space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActivePath('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Home
              </Link>
              <Link
                to="/recommendations"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActivePath('/recommendations')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Recommendations
              </Link>
              <Link
                to="/internships"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActivePath('/internships')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                All Internships
              </Link>
              <Link
                to="/analytics"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActivePath('/analytics')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Analytics
              </Link>
            </nav>
          )}

          {/* Right: User / Auth */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <img
                    src={getUserAvatar()}
                    alt={getUserName()}
                    className="h-8 w-8 rounded-full ring-2 ring-white"
                  />
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
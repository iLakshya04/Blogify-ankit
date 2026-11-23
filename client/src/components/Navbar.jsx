import { PenLine } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || "";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
        <Link
          to="/"
          className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded"
        >
          Blogify
        </Link>

        {user ? (
          <nav className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link
              to="/my-blogs"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1.5"
            >
              My Blogs
            </Link>

            <Link
              to="/write"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              <PenLine className="w-4 h-4" />
              <span>Write</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 shrink-0">
              <span
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center shrink-0"
              >
                {initial}
              </span>
              <span className="text-sm font-medium text-gray-800 max-w-[110px] truncate">
                {firstName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1.5"
            >
              Log out
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1.5"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

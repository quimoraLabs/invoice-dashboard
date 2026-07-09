import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext/useAuth";
import { doSignOut } from "../firebase/auth";
import { HiMenu, HiX, HiHome, HiUsers, HiCube, HiDocumentText, HiLogout, HiUser } from "react-icons/hi";
import ProfileModal from "../components/modals/ProfileViewModal"; // Importing the new modal below

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userLoggedIn, currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { to: "/home", label: "Dashboard", icon: <HiHome size={18} /> },
    { to: "/customers", label: "Customers", icon: <HiUsers size={18} /> },
    { to: "/products", label: "Products", icon: <HiCube size={18} /> },
    { to: "/invoice", label: "Invoices", icon: <HiDocumentText size={18} /> },
  ];

  const handleLogout = () => {
    doSignOut().then(() => navigate("/login"));
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/home" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-base font-semibold text-white shadow-sm">
              I
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Invomora</p>
              <p className="text-xs text-slate-500">Invoice dashboard</p>
            </div>
          </Link>

          {userLoggedIn ? (
            <>
              {/* Desktop Tabs */}
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 md:flex">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Clean Standalone Avatar Trigger */}
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ring-2 ring-transparent transition hover:ring-slate-200 focus:outline-none"
                >
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <HiUser size={18} className="text-slate-500" />
                  )}
                </button>

                {/* Professional Compact Dropdown Card */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                    <button
                      onClick={() => {
                        setIsProfileModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <HiUser size={16} className="text-slate-400" />
                      My Profile
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50/60"
                    >
                      <HiLogout size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden gap-3 md:flex">
              <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Login</Link>
              <Link to="/register" className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Register</Link>
            </div>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full border border-slate-200 p-2 text-slate-700 md:hidden"
          >
            {isMenuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
          </button>
        </nav>

        {/* Mobile Sidebar Navigation */}
        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
            {userLoggedIn ? (
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium ${
                      location.pathname === item.to ? "bg-indigo-600 text-white" : "text-slate-600"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
                
                <button
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600"
                >
                  <HiUser size={18} />
                  My Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-red-600"
                >
                  <HiLogout size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl px-3 py-2 text-sm font-medium text-slate-600">Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Register</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Account Profile Slide/Modal Mount Layer */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
};

export default Header;